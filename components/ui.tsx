"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ArrowRight, ShoppingBag } from "@phosphor-icons/react";
import type { ReactNode } from "react";
export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="drawer" aria-describedby={undefined}>
          <div className="drawer-head">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close className="icon-btn" aria-label="Close drawer">
              <X size={24} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Arrow() {
  return <ArrowRight size={19} />;
}
export function ProductImage({
  image,
  name,
  className = "",
}: {
  image: string;
  name: string;
  className?: string;
}) {
  if (!image)
    return (
      <div
        className={`product-photo ${className}`}
        role="img"
        aria-label={`${name} — photo coming soon`}
        style={{
          display: "grid",
          placeItems: "center",
          background: "#f4f2e9",
          color: "#687361",
          fontSize: "0.85rem",
        }}
      >
        Product photo coming soon
      </div>
    );
  if (
    image.startsWith("data:") ||
    image.startsWith("https:") ||
    image.startsWith("/api/images/") ||
    image.startsWith("/product-images/")
  )
    return (
      <img
        className={`product-photo ${className}`}
        src={image}
        loading="lazy"
        alt={
          image.startsWith("/product-images/")
            ? `${name} — representative product-type photograph; actual item may vary`
            : name
        }
      />
    );
  return (
    <div
      role="img"
      aria-label={`${name} — representative image from our business poster`}
      className={`product-photo poster-crop crop-${image} ${className}`}
    />
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <ShoppingBag size={36} />
      <h3>{title}</h3>
      {children}
    </div>
  );
}
