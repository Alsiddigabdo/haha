# اعملها براك - منصة إبداعية

منصة إبداعية شاملة تجمع المبدعين والمصممين والمطورين في مكان واحد.

## المميزات

- **المنتدى الإبداعي**: مشاركة الأعمال والمنشورات
- **نظام الوظائف**: البحث عن وظائف وعرض المهارات
- **نظام الصداقة**: التواصل مع المبدعين الآخرين
- **نظام الرسائل**: المحادثات المباشرة
- **المتاجر الإبداعية**: بيع وشراء الأعمال الإبداعية
- **لوحة الإدارة**: إدارة شاملة للموقع

## التقنيات المستخدمة

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Frontend**: EJS, HTML5, CSS3, JavaScript
- **File Storage**: Cloudinary
- **Deployment**: Vercel

## الإعداد المحلي

### المتطلبات
- Node.js (v14 أو أحدث)
- MySQL
- حساب Cloudinary

### التثبيت

1. استنسخ المشروع:
```bash
git clone <repository-url>
cd ihobe
```

2. ثبت التبعيات:
```bash
npm install
```

3. أنشئ ملف `.env`:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ihobe

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server
PORT=8080
NODE_ENV=development
```

4. أنشئ قاعدة البيانات:
```sql
CREATE DATABASE ihobe;
USE ihobe;
-- قم بتشغيل ملف Schema.sql
```

5. شغل التطبيق:
```bash
npm start
```

## النشر على Vercel

1. ارفع المشروع إلى GitHub
2. اربط المشروع بـ Vercel
3. أضف متغيرات البيئة في إعدادات Vercel:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`

## هيكل المشروع

```
ihobe/
├── config/           # إعدادات قاعدة البيانات و Cloudinary
├── controllers/      # منطق الأعمال
├── middleware/       # الوسائط البرمجية
├── models/          # نماذج قاعدة البيانات
├── public/          # الملفات الثابتة
├── router/          # مسارات التطبيق
├── uploads/         # الملفات المرفوعة (محلياً فقط)
├── utils/           # أدوات مساعدة
├── views/           # قوالب العرض
├── index.js         # نقطة البداية
└── vercel.json      # إعدادات Vercel
```

## نظام الملفات

- **Cloudinary**: جميع الصور الجديدة تُرفع إلى Cloudinary
- **الصور الافتراضية**: موجودة في `public/images/`
- **الملفات الثابتة**: CSS, JS, Fonts في `public/`

## المساهمة

1. Fork المشروع
2. أنشئ فرع جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى الفرع (`git push origin feature/AmazingFeature`)
5. افتح Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.

## الدعم

للدعم التقني، يرجى التواصل عبر:
- البريد الإلكتروني: support@ihobe.com
- GitHub Issues