"use client";

import { paymentsService } from "@/lib/services/payments-service";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

export default function PortalButton() {
  const { accessTokenRaw } = useKindeBrowserClient();

  return (
    <Button
      onClick={() => {
        if (!accessTokenRaw) {
          toast({
            variant: "destructive",
            description:
              "You need to be logged in to manage your subscription.",
          });
          return;
        }

        paymentsService
          .createPortal(accessTokenRaw)
          .then((url) => window.location.assign(url))
          .catch(() => {
            toast({
              variant: "destructive",
              description:
                "Something went wrong. Please refresh and try again.",
            });
          });
      }}
      variant="secondary-gray"
      size="sm"
    >
      Manage
    </Button>
  );
}
