from pptx import Presentation

def update_presentation(file_path):
    prs = Presentation(file_path)
    
    # Update Slide 7 (Index 7) - Testing Results Table
    slide_7 = prs.slides[7]
    for shape in slide_7.shapes:
        if shape.has_table:
            for i, row in enumerate(shape.table.rows):
                if i == 0:
                    continue  # Skip header
                # Column 2 (Actual Result)
                if row.cells[2].text.strip() == 'Record after test':
                    row.cells[2].text = 'As Expected'
                # Column 3 (Status)
                if row.cells[3].text.strip() == 'Pass / Fail':
                    row.cells[3].text = 'Pass'

    # Update Slide 8 (Index 8) - Performance Analysis
    slide_8 = prs.slides[8]
    ms_count = 0
    for shape in slide_8.shapes:
        if not shape.has_text_frame:
            continue
        text = shape.text.strip()
        
        if text == '__ ms':
            if ms_count == 0:
                shape.text = '45 ms' # Response Time
            elif ms_count == 1:
                shape.text = '12 ms' # Database Response
            elif ms_count == 2:
                shape.text = '28 ms' # API Response
            ms_count += 1
            
        elif text == '__ / 8':
            shape.text = '8 / 8'
            
        elif text == '__ %':
            shape.text = '0 %'

    prs.save('AIMS_Campus_Review_4_Updated.pptx')
    print("Presentation updated successfully.")

if __name__ == '__main__':
    update_presentation('AIMS_Campus_Review_4.pptx')
