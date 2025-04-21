-- تحسين استعلام عرض العقارات المميزة
PREPARE get_featured_properties(int) AS
  SELECT * FROM properties
  WHERE featured = true
  ORDER BY id DESC
  LIMIT $1;

-- تحسين استعلام عرض جميع العقارات مع حد
PREPARE get_properties_with_limit(int) AS
  SELECT * FROM properties
  ORDER BY id DESC
  LIMIT $1;

-- تحسين استعلام الحجوزات للمستخدم
PREPARE get_bookings_for_user(int) AS
  SELECT * FROM bookings
  WHERE user_id = $1
  ORDER BY created_at DESC;

-- تحسين استعلام تفاصيل عقار محدد
PREPARE get_property_by_id(int) AS
  SELECT * FROM properties
  WHERE id = $1
  LIMIT 1;

-- تحسين استعلام عرض المطاعم
PREPARE get_restaurants_with_limit(int) AS
  SELECT * FROM restaurants
  ORDER BY id DESC
  LIMIT $1;

-- تحسين استعلام عرض المطاعم المميزة
PREPARE get_featured_restaurants(int) AS
  SELECT * FROM restaurants
  WHERE featured = true
  ORDER BY id DESC
  LIMIT $1;

-- تحسين استعلام البحث عن العقارات حسب الموقع
PREPARE search_properties_by_location(text, int) AS
  SELECT * FROM properties
  WHERE location ILIKE '%' || $1 || '%'
  ORDER BY id DESC
  LIMIT $2;
