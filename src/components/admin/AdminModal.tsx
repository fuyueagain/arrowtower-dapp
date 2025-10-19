import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Field {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  disabled?: boolean;
}

interface AdminModalProps {
  open: boolean;
  title: string;
  fields: Field[];
  formData: Record<string, any>;
  onChange: (name: string, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitText?: string;
  loading?: boolean;
}

export function AdminModal({
  open,
  title,
  fields,
  formData,
  onChange,
  onSubmit,
  onCancel,
  submitText = '提交',
  loading = false
}: AdminModalProps) {
  if (!open) return null;

  const handleSubmit = () => {
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-emerald-200">
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">{title}</h2>
        
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {field.type === 'textarea' ? (
                <textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  rows={4}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all disabled:bg-gray-100"
                />
              ) : field.type === 'select' ? (
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  disabled={field.disabled}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all disabled:bg-gray-100"
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData[field.name] || false}
                    onChange={(e) => onChange(field.name, e.target.checked)}
                    disabled={field.disabled}
                    className="w-5 h-5 text-emerald-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-emerald-200"
                  />
                  <span className="ml-2 text-sm text-gray-600">{field.placeholder}</span>
                </div>
              ) : (
                <input
                  type={field.type}
                  value={formData[field.name] || ''}
                  onChange={(e) => onChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all disabled:bg-gray-100"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={loading}
            className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>提交中...</span>
              </div>
            ) : (
              submitText
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}