-- Password for admin is 'admin123'
-- Password for user1 is 'user123'
INSERT INTO user_schema.users (username, password, full_name, role) VALUES
  ('admin', '$2a$10$mC.lHj0FjR.F8w/y9C.Ceu5C1sZ9z4d63W/2qNn11Kq02.YyqgA2y', 'Admin 7-Eleven', 'ADMIN'),
  ('user1', '$2a$10$UoQcZq3D43Y75Y7j0vKfeuxhR47CgYF48aZ1P14w7dO.v.5yvE4Dq', 'Nguyễn Văn A', 'USER');

INSERT INTO product_schema.products (name, sku, description, category, price, stock_quantity, image_url, is_active) VALUES
  ('Bánh mì sandwich gà nướng', 'BM-001', 'Bánh mì sandwich mềm kẹp nhân thịt gà nướng thơm ngon hảo hạng.', 'Bakery', 35000.00, 42, 'https://images.unsplash.com/photo-1509722747041-616f39b57569', true),
  ('Cà phê sữa đá 250ml', 'CF-002', 'Cà phê phin truyền thống kết hợp cùng sữa đặc và đá mát lạnh.', 'Beverage', 25000.00, 8, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c', true),
  ('Snack Poca vị tôm', 'SN-003', 'Bánh snack giòn rụm đậm đà vị tôm tự nhiên siêu hấp dẫn.', 'Snack', 15000.00, 120, 'https://images.unsplash.com/photo-1621447504864-d8686e12698c', true),
  ('Mì ly Hảo Hảo tôm chua cay', 'MI-004', 'Mì ly ăn liền quốc dân vị tôm chua cay hấp dẫn mọi lứa tuổi.', 'Instant Food', 8000.00, 0, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624', false),
  ('Trà xanh Olong Tea+', 'TR-005', 'Trà ô long Tea Plus thanh mát, ít ngọt, hỗ trợ tiêu hóa tốt.', 'Beverage', 12000.00, 67, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3', true),
  ('Bánh tráng trộn', 'BT-006', 'Bánh tráng trộn khô bò, trứng cút, đậu phộng chuẩn vị đường phố.', 'Snack', 20000.00, 5, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc', true),
  ('Combo bữa sáng set A', 'CB-007', 'Combo tiết kiệm gồm 1 bánh mì sandwich gà nướng và 1 cà phê sữa đá.', 'Combo', 55000.00, 30, 'https://images.unsplash.com/photo-1495214783159-3503fd1b572d', true),
  ('Sữa tươi Vinamilk 180ml', 'SM-008', 'Sữa tươi tiệt trùng Vinamilk 100% nguyên chất có đường bổ dưỡng.', 'Dairy', 12000.00, 200, 'https://images.unsplash.com/photo-1563636619-e9143da7973b', true);
