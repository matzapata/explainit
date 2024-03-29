"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Button, ButtonProps } from "../ui/button";
import { toast } from "../ui/use-toast";
import { paymentsService } from "@/lib/services/payments-service";
import { useState } from "react";

export default function GoProButton({children, ...props}: ButtonProps) {
  const { accessTokenRaw } = useKindeBrowserClient();
  const [loading, setIsLoading] = useState(false);
  

  return (
    <Button
      onClick={() => {
        if (!accessTokenRaw) {
          alert("You need to be logged in to subscribe to a plan.")
          return window.location.assign("/api/auth/login?post_login_redirect_url=/#pricing");
        }

        setIsLoading(true);
        paymentsService
          .createCheckout(accessTokenRaw)
          .then((url) => window.location.assign(url))
          .catch(() => {
            toast({
              variant: "destructive",
              description: "Something went wrong. Please try again.",
            });
          })
          .finally(() => setIsLoading(false));
      }}
      variant="primary"
      size="sm"
      isLoading={loading}
      {...props}
    >
      {children || "Go Pro"}
    </Button>
  );
}
