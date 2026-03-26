import { Suspense } from "react";
import { LoginPanel } from "@/components/login-panel";

export default function LoginPage() {
  return (
    <div className="py-6">
      <Suspense fallback={null}>
        <LoginPanel />
      </Suspense>
    </div>
  );
}
