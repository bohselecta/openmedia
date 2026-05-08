import { Suspense } from "react";
import { ImageStudio } from "@/components/studio/ImageStudio";

export default function ImageStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="px-8 py-12 text-sm text-ink-muted">
          Loading Image Studio…
        </div>
      }
    >
      <ImageStudio />
    </Suspense>
  );
}
