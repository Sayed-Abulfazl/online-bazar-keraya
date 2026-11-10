"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { UserRouteAccess } from "@/components/RouteAccess";
import {
  ArrowRight,
  ImagePlus,
  LoaderCircle,
  PackagePlus,
  X,
} from "lucide-react";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const itemFormSchema=z.object({name:z.string().trim().min(2,"نام جنس باید حداقل ۲ حرف باشد.").max(100,"نام جنس نباید بیشتر از ۱۰۰ حرف باشد."),description:z.string().trim().max(1000,"توضیحات نباید بیشتر از ۱۰۰۰ حرف باشد."),priceDaily:z.coerce.number().min(1,"قیمت روزانه باید حداقل ۱ افغانی باشد.")});

function NewItemPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceDaily, setPriceDaily] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({});
  const [imageError, setImageError] = useState("");

  const shopId = searchParams.get('shopId') ?? "";

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.currentTarget.files?.[0];

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("فرمت عکس باید JPG، PNG یا WEBP باشد.");
      event.currentTarget.value = "";
      return;
    }

    if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
      toast.error("حجم عکس باید بیشتر از صفر و حداکثر ۲ مگابایت باشد.");
      event.currentTarget.value = "";
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const preview = URL.createObjectURL(file);

    previewUrlRef.current = preview;
    setImage(file);
    setImagePreview(preview);
    setImageError("");
  }

  function removeImage() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setImage(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!shopId) {
      toast.error("شناسه فروشگاه مشخص نیست.");
      return;
    }

    const checked = itemFormSchema.safeParse({ name, description, priceDaily });
    if (!checked.success) {
      const next:Record<string,string>={}; checked.error.issues.forEach(issue=>{const key=String(issue.path[0]||"");if(key&&!next[key])next[key]=issue.message;}); setFieldErrors(next); return;
    }
    setFieldErrors({});
    const dailyPrice = checked.data.priceDaily;

    if (!image) { setImageError("انتخاب عکس جنس الزامی است."); return; }
    setImageError("");

    const formData = new FormData();

    formData.append("shopId", shopId);
    formData.append("name", name.trim());
    formData.append("description", description.trim());
    formData.append("priceDaily", String(dailyPrice));
    formData.append("image", image);

    setLoading(true);

    try {
      const response = await axios.post(
        "/api/items",
        formData,
        {
          withCredentials: true,
        }
      );

      toast.success(
        response.data?.message || "جنس با موفقیت ثبت شد."
      );

      router.push(`/shops/${shopId}`);
      router.refresh();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "ثبت جنس انجام نشد. دوباره تلاش کنید."
        );
      } else {
        toast.error("یک خطای غیرمنتظره رخ داد.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      
      className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900"
    >
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-900"
        >
          <ArrowRight size={18} />
          برگشت
        </button>

        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
            <PackagePlus size={28} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              افزودن جنس جدید
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              مشخصات جنس و قیمت کرایه روزانه را وارد کنید.
            </p>
          </div>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold"
            >
              نام جنس <span className="text-red-500">*</span>
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => {setName(event.target.value);setFieldErrors(old=>({...old,name:""}));}}
              placeholder="مثلاً: دریل برقی"
              className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${fieldErrors.name?"border-red-400 bg-red-50":"border-gray-300"}`}
            />
            {fieldErrors.name&&<p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.name}</p>}
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-semibold"
            >
              توضیحات جنس
            </label>

            <textarea
              id="description"
              rows={4}
              maxLength={1000}
              value={description}
              onChange={(event) => {setDescription(event.target.value);setFieldErrors(old=>({...old,description:""}));}}
              placeholder="مشخصات و وضعیت جنس را بنویسید..."
              className={`w-full resize-y rounded-xl border px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${fieldErrors.description?"border-red-400 bg-red-50":"border-gray-300"}`}
            />

            <p className="mt-1 text-left text-xs text-gray-400">
              {description.length}/1000
            </p>
            {fieldErrors.description&&<p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.description}</p>}
          </div>

          <div>
            <label
              htmlFor="priceDaily"
              className="mb-2 block text-sm font-semibold"
            >
              قیمت کرایه روزانه <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                id="priceDaily"
                type="number"
                required
                min="1"
                step="any"
                value={priceDaily}
                onChange={(event) => {setPriceDaily(event.target.value);setFieldErrors(old=>({...old,priceDaily:""}));}}
                placeholder="مثلاً: 500"
                className={`w-full rounded-xl border px-4 py-3 pl-16 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${fieldErrors.priceDaily?"border-red-400 bg-red-50":"border-gray-300"}`}
              />

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                افغانی
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-500">قیمت برای یک روز کامل محاسبه می‌شود.</p>{fieldErrors.priceDaily&&<p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.priceDaily}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              عکس جنس <span className="text-red-500">*</span>
            </label>

            {imagePreview ? (
              <div className="relative overflow-hidden rounded-xl border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="پیش‌نمایش عکس جنس"
                  className="h-64 w-full object-contain bg-gray-50"
                />

                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="حذف عکس انتخاب‌شده"
                  className="absolute left-3 top-3 rounded-full bg-white p-2 text-red-600 shadow transition hover:bg-red-50"
                >
                  <X size={18} />
                </button>

                <div className="border-t border-gray-200 px-4 py-3 text-xs text-gray-500">
                  {image?.name} —{" "}
                  {((image?.size ?? 0) / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-4 py-10 text-gray-500 transition hover:border-blue-400 hover:bg-blue-50"
              >
                <ImagePlus size={36} className="mb-3" />
                <span className="font-medium">
                  برای انتخاب عکس کلیک کنید
                </span>
                <span className="mt-2 text-xs">
                  JPG، PNG یا WEBP — حداکثر ۲ مگابایت
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />

            {imagePreview && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                تغییر عکس
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !shopId}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <LoaderCircle size={20} className="animate-spin" />
                در حال ثبت...
              </>
            ) : (
              <>
                <PackagePlus size={20} />
                ثبت جنس
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}


export default function NewItemPage() {
  return <UserRouteAccess allow={["owner"]}><NewItemPageContent /></UserRouteAccess>;
}
