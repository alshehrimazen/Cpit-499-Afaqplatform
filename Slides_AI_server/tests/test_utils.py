from rag_generate import ( parse_module_id, normalize_keypoints, parse_student_profile, clean_to_arabic_text,)

def test_parse_module_id_json():
    module_id = '{"lessonTitle": "الجهاز التنفسي", "subject": "أحياء"}'
    result = parse_module_id(module_id)

    assert result["lessonTitle"] == "الجهاز التنفسي"
    assert result["subject"] == "أحياء"

def test_normalize_keypoints_string():
    value = "- النقطة الأولى، النقطة الثانية\nالنقطة الثالثة"
    result = normalize_keypoints(value)

    assert result == ["النقطة الأولى", "النقطة الثانية", "النقطة الثالثة"]

def test_parse_student_profile_multiple_subjects():
    text = "أحياء ممتاز, كيمياء جيد"
    result = parse_student_profile(text)

    assert result == [
        {"subject": "أحياء", "level": "ممتاز"},
        {"subject": "كيمياء", "level": "جيد"},
    ]

def test_clean_to_arabic_text_removes_english_symbols():
    text = "Biology 101: الجهاز التنفسي! @#"
    result = clean_to_arabic_text(text)

    assert result == "101 الجهاز التنفسي"