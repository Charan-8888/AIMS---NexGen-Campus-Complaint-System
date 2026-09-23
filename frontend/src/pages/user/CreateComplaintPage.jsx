import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Upload, X, Loader2, Sparkles, CheckCircle2,
  AlertTriangle, MapPin, Tag, BarChart2, Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { complaintsApi, adminApi } from '../../api/complaints';

const PRIORITY_COLORS = {
  LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444',
};

const CreateComplaintPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiTimeout, setAiTimeout] = useState(null);

  const title = watch('title');
  const description = watch('description');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, locRes] = await Promise.all([
          adminApi.getCategories(),
          adminApi.getLocations(),
        ]);
        setCategories(catRes.data.data || []);
        const locs = locRes.data.data || [];
        setLocations(locs);
        // Extract unique buildings
        const uniqueBuildings = [...new Set(locs.map((l) => l.building))].sort();
        setBuildings(uniqueBuildings);
      } catch {
        // Use defaults if admin API fails
      }
    };
    loadData();
  }, []);

  // Live AI preview as user types (debounced)
  useEffect(() => {
    if (!title || !description || title.length < 5 || description.length < 10) {
      setAiPreview(null);
      return;
    }
    if (aiTimeout) clearTimeout(aiTimeout);
    const t = setTimeout(async () => {
      setAnalyzing(true);
      try {
        // Use mock analysis for preview (no actual API call until submit)
        const mockCategories = {
          water: { category: 'Plumbing', priority: 'HIGH', dept: 'Plumbing Maintenance', confidence: 0.91 },
          leak: { category: 'Plumbing', priority: 'HIGH', dept: 'Plumbing Maintenance', confidence: 0.91 },
          fan: { category: 'Electrical', priority: 'MEDIUM', dept: 'Electrical Maintenance', confidence: 0.87 },
          light: { category: 'Electrical', priority: 'MEDIUM', dept: 'Electrical Maintenance', confidence: 0.87 },
          ac: { category: 'HVAC', priority: 'HIGH', dept: 'HVAC Maintenance', confidence: 0.93 },
          cooling: { category: 'HVAC', priority: 'HIGH', dept: 'HVAC Maintenance', confidence: 0.93 },
          wifi: { category: 'IT/Network', priority: 'MEDIUM', dept: 'IT Support', confidence: 0.89 },
          internet: { category: 'IT/Network', priority: 'MEDIUM', dept: 'IT Support', confidence: 0.89 },
          projector: { category: 'IT/Network', priority: 'MEDIUM', dept: 'IT Support', confidence: 0.82 },
          desk: { category: 'Furniture', priority: 'LOW', dept: 'Furniture & Civil', confidence: 0.84 },
          chair: { category: 'Furniture', priority: 'LOW', dept: 'Furniture & Civil', confidence: 0.84 },
          clean: { category: 'Cleaning', priority: 'MEDIUM', dept: 'Housekeeping', confidence: 0.88 },
        };
        const text = `${title} ${description}`.toLowerCase();
        const matched = Object.entries(mockCategories).find(([kw]) => text.includes(kw));
        const isCritical = /flood|fire|electrocut|collapse|hazard|emerg/.test(text);

        if (matched) {
          const result = matched[1];
          setAiPreview({
            ...result,
            priority: isCritical ? 'CRITICAL' : result.priority,
            reason: `Complaint mentions ${matched[0]}-related keywords. ${isCritical ? 'Emergency keywords detected — upgraded to CRITICAL.' : ''}`,
          });
        } else {
          setAiPreview({
            category: 'General Maintenance',
            priority: isCritical ? 'CRITICAL' : 'MEDIUM',
            dept: 'General Maintenance',
            confidence: 0.72,
            reason: 'General maintenance request. Final classification will be determined by AI on submission.',
          });
        }
      } finally {
        setAnalyzing(false);
      }
    }, 800);
    setAiTimeout(t);
    return () => clearTimeout(t);
  }, [title, description]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    const newImages = files.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (idx) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      if (data.categoryId) formData.append('categoryId', data.categoryId);
      if (data.locationId) formData.append('locationId', data.locationId);
      if (data.building) formData.append('building', data.building);
      if (data.floor) formData.append('floor', data.floor);
      if (data.room) formData.append('room', data.room);
      if (data.area) formData.append('area', data.area);
      if (data.contactPhone) formData.append('contactPhone', data.contactPhone);

      images.forEach(({ file }) => formData.append('images', file));

      const { data: res } = await complaintsApi.create(formData);
      toast.success(`Complaint ${res.data.complaint.complaintNumber} submitted! AI is analyzing...`);
      navigate(`/complaints/${res.data.complaint._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLocations = selectedBuilding
    ? locations.filter((l) => l.building === selectedBuilding)
    : locations;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Submit Complaint</h1>
          <p className="page-subtitle">Describe the issue and our AI will classify it automatically</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Main Form */}
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Title */}
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tag size={16} color="#6366f1" /> Complaint Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Brief description of the issue (e.g., AC not cooling in Room A-305)"
                  {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'At least 5 characters' } })}
                />
                {errors.title && <span className="form-error">{errors.title.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description *</label>
                <textarea
                  className="input"
                  placeholder="Provide a detailed description of the problem. When did it start? How severe is it? Who is affected?"
                  rows={5}
                  {...register('description', { required: 'Description is required', minLength: { value: 10, message: 'At least 10 characters' } })}
                />
                {errors.description && <span className="form-error">{errors.description.message}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="input" {...register('categoryId')}>
                    <option value="">— AI will suggest —</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone (optional)</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="10-digit number"
                    {...register('contactPhone')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} color="#6366f1" /> Location
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Building *</label>
                  <select
                    className="input"
                    {...register('building', { required: 'Building is required' })}
                    onChange={(e) => {
                      setSelectedBuilding(e.target.value);
                      setValue('locationId', '');
                    }}
                  >
                    <option value="">Select building</option>
                    {buildings.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                  {errors.building && <span className="form-error">{errors.building.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Floor</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g. 3"
                    min={0}
                    max={20}
                    {...register('floor')}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Room / Location</label>
                  {filteredLocations.length > 0 ? (
                    <select className="input" {...register('locationId')}>
                      <option value="">Select room</option>
                      {filteredLocations.map((l) => (
                        <option key={l._id} value={l._id}>
                          {l.room} — {l.area}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. A-305"
                      {...register('room')}
                    />
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Area / Description</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Computer Lab, Corridor"
                    {...register('area')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={16} color="#6366f1" /> Upload Images
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(optional, max 5)</span>
            </h3>

            {/* Drag zone */}
            <label style={{
              display: 'block',
              border: '2px dashed var(--border)',
              borderRadius: 10,
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              transition: 'border-color 0.2s',
            }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
                if (images.length + files.length > 5) { toast.error('Max 5 images'); return; }
                setImages((prev) => [...prev, ...files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }))]);
              }}
            >
              <Upload size={24} style={{ margin: '0 auto 0.5rem' }} />
              <div>Drop images here or <strong style={{ color: '#6366f1' }}>click to browse</strong></div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>JPEG, PNG, WebP — max 10MB each</div>
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageSelect} />
            </label>

            {/* Preview */}
            {images.length > 0 && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <img
                      src={img.preview}
                      alt=""
                      style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      style={{
                        position: 'absolute', top: -6, right: -6,
                        width: 20, height: 20, borderRadius: '50%',
                        background: '#ef4444', border: 'none', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={submitting}
            style={{ width: '100%' }}
          >
            {submitting ? (
              <><Loader2 size={18} className="animate-spin" /> Submitting...</>
            ) : (
              <><CheckCircle2 size={18} /> Submit Complaint</>
            )}
          </button>
        </form>

        {/* AI Preview Sidebar */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <div className="ai-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={14} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>AI Analysis Preview</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Updates as you type</div>
              </div>
              {analyzing && <Loader2 size={14} className="animate-spin" style={{ color: '#6366f1', marginLeft: 'auto' }} />}
            </div>

            {!aiPreview && !analyzing ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '1rem 0' }}>
                Start typing your complaint to see AI analysis preview...
              </div>
            ) : aiPreview ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {/* Category */}
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Category
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Tag size={14} color="#6366f1" />
                    {aiPreview.category}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {Math.round((aiPreview.confidence || 0.8) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Priority
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    background: `${PRIORITY_COLORS[aiPreview.priority]}22`,
                    color: PRIORITY_COLORS[aiPreview.priority],
                    padding: '0.25rem 0.75rem', borderRadius: 99,
                    fontSize: '0.8125rem', fontWeight: 700,
                  }}>
                    {aiPreview.priority === 'CRITICAL' && <AlertTriangle size={12} />}
                    {aiPreview.priority}
                  </div>
                </div>

                {/* Department */}
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Assigned to
                  </div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={14} color="#6366f1" />
                    {aiPreview.dept}
                  </div>
                </div>

                {/* Reason */}
                <div style={{
                  background: 'var(--surface-1)',
                  borderRadius: 8,
                  padding: '0.75rem',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}>
                  {aiPreview.reason}
                </div>

                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  ✨ Final AI classification happens on submission
                </div>
              </div>
            ) : null}
          </div>

          {/* Tips */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <h4 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              💡 Tips for Better AI Results
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1rem' }}>
              <li>Be specific about the location (building, floor, room)</li>
              <li>Describe the problem clearly (not just "something is broken")</li>
              <li>Mention if it's affecting multiple people</li>
              <li>Upload photos — they speed up diagnosis</li>
              <li>Use emergency words for critical issues (flood, fire, hazard)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateComplaintPage;
