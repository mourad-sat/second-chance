import { AppShell } from "@/components/AppShell";

const Field = ({ label, name, type = "text" }: { label: string; name: string; type?: string }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium">{label}</span>
    <input name={name} type={type} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-700" />
  </label>
);

export default function NewBeneficiaryPage() {
  return (
    <AppShell>
      <header className="mb-8">
        <h2 className="text-3xl font-bold">تسجيل مستفيد جديد</h2>
        <p className="text-slate-600 mt-2">المرحلة الأولى: المعلومات الأساسية وبيانات الاتصال</p>
      </header>
      <form className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="الاسم العائلي" name="lastName" />
          <Field label="الاسم الشخصي" name="firstName" />
          <Field label="تاريخ الميلاد" name="birthDate" type="date" />
          <Field label="رقم البطاقة الوطنية أو مسار" name="identityNumber" />
          <Field label="رقم الهاتف" name="phone" type="tel" />
          <Field label="هاتف ولي الأمر" name="guardianPhone" type="tel" />
          <Field label="العنوان" name="address" />
          <Field label="آخر مستوى دراسي" name="lastEducationLevel" />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="reset" className="rounded-xl border border-slate-300 px-5 py-3">إفراغ الحقول</button>
          <button type="submit" className="rounded-xl bg-slate-900 px-6 py-3 text-white">حفظ الملف الأولي</button>
        </div>
      </form>
    </AppShell>
  );
}
