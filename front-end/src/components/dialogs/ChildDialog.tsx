import React, { useState, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { vi } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Alert, AlertDescription } from "../ui/alert";
import { ChildInfo } from "../../types/user.types";

// Register Vietnamese locale
registerLocale("vi", vi);

interface ChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  child?: ChildInfo | null;
  onSave: (childData: Partial<ChildInfo>) => Promise<void>;
  mode: "add" | "edit";
}

const ChildDialog: React.FC<ChildDialogProps> = ({
  open,
  onOpenChange,
  child,
  onSave,
  mode,
}) => {
  const [formData, setFormData] = useState<Partial<ChildInfo>>({
    name: "",
    birth_date: "",
    gender: "",
    weight: undefined,
    height: undefined,
    medical_history: "",
    allergies: "",
    vaccination_record: "",
  });
  const [selectedBirthDate, setSelectedBirthDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (child && mode === "edit") {
      setFormData({
        name: child.name || "",
        birth_date: child.birth_date || "",
        gender: child.gender || "",
        weight: child.weight || undefined,
        height: child.height || undefined,
        medical_history: child.medical_history || "",
        allergies: child.allergies || "",
        vaccination_record: child.vaccination_record || "",
      });
      // Convert birth_date string to Date object for DatePicker
      if (child.birth_date) {
        setSelectedBirthDate(new Date(child.birth_date));
      } else {
        setSelectedBirthDate(null);
      }
    } else {
      setFormData({
        name: "",
        birth_date: "",
        gender: "",
        weight: undefined,
        height: undefined,
        medical_history: "",
        allergies: "",
        vaccination_record: "",
      });
      setSelectedBirthDate(null);
    }
    setError("");
  }, [child, mode, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "weight" || name === "height" ? (value ? parseFloat(value) : undefined) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedBirthDate(date);
    if (date) {
      // Convert Date to YYYY-MM-DD format for backend
      const formattedDate = date.toISOString().split('T')[0];
      setFormData((prev) => ({
        ...prev,
        birth_date: formattedDate,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        birth_date: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!formData.name?.trim()) {
        throw new Error("Tên trẻ là bắt buộc");
      }
      if (!formData.birth_date) {
        throw new Error("Ngày sinh là bắt buộc");
      }

      await onSave(formData);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto p-2 sm:p-4">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-sm sm:text-base">
            {mode === "add" ? "Thêm thông tin trẻ" : "Chỉnh sửa thông tin trẻ"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {mode === "add" 
              ? "Nhập thông tin chi tiết của trẻ em"
              : "Cập nhật thông tin chi tiết của trẻ em"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 sm:space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs sm:text-sm font-medium">Tên trẻ *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  placeholder="Nhập tên trẻ"
                  required
                  className="w-full h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs sm:text-sm font-medium">Ngày sinh *</Label>
                <DatePicker
                  selected={selectedBirthDate}
                  onChange={handleDateChange}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Nhập ngày sinh"
                  maxDate={new Date()}
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  required
                  className="flex h-8 sm:h-9 w-full rounded-md border border-input bg-background px-2 sm:px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="space-y-1">
                <Label htmlFor="gender" className="text-xs sm:text-sm font-medium">Giới tính</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("gender", value)}
                  value={formData.gender || ""}
                >
                  <SelectTrigger className="w-full h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="weight" className="text-xs sm:text-sm font-medium">Cân nặng (kg)</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.weight || ""}
                  onChange={handleChange}
                  placeholder="0.0"
                  className="w-full h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="height" className="text-xs sm:text-sm font-medium">Chiều cao (cm)</Label>
                <Input
                  id="height"
                  name="height"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.height || ""}
                  onChange={handleChange}
                  placeholder="0.0"
                  className="w-full h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="medical_history" className="text-xs sm:text-sm font-medium">Tiền sử bệnh</Label>
              <Textarea
                id="medical_history"
                name="medical_history"
                value={formData.medical_history || ""}
                onChange={handleChange}
                placeholder="Mô tả tiền sử bệnh của trẻ..."
                rows={2}
                className="w-full resize-none text-xs sm:text-sm min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div className="space-y-1">
                <Label htmlFor="allergies" className="text-xs sm:text-sm font-medium">Dị ứng</Label>
                <Textarea
                  id="allergies"
                  name="allergies"
                  value={formData.allergies || ""}
                  onChange={handleChange}
                  placeholder="Mô tả dị ứng..."
                  rows={2}
                  className="w-full resize-none text-xs sm:text-sm min-h-[60px]"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="vaccination_record" className="text-xs sm:text-sm font-medium">Lịch sử tiêm chủng</Label>
                <Textarea
                  id="vaccination_record"
                  name="vaccination_record"
                  value={formData.vaccination_record || ""}
                  onChange={handleChange}
                  placeholder="Ghi chú tiêm chủng..."
                  rows={2}
                  className="w-full resize-none text-xs sm:text-sm min-h-[60px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-8 sm:h-9 text-xs sm:text-sm px-3"
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} className="h-8 sm:h-9 text-xs sm:text-sm px-3">
              {isLoading ? "Đang lưu..." : mode === "add" ? "Thêm trẻ" : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChildDialog;