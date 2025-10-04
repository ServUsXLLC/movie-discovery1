"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type DialogContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function Dialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <DialogContext.Provider value={{ isOpen, open, close }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: React.ReactElement;
}) {
  const ctx = useContext(DialogContext);
  if (!ctx) return children;

  const handleClick = (e: React.MouseEvent) => {
    children.props.onClick?.(e);
    if (!e.defaultPrevented) ctx.open();
  };

  if (asChild) {
    return React.cloneElement(children, { onClick: handleClick });
  }
  return (
    <button onClick={handleClick} type="button">
      {children}
    </button>
  );
}

export function DialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = useContext(DialogContext);
  if (!ctx) return null;
  if (!ctx.isOpen) return null;

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) ctx.close();
  };

  return (
    <div
      onClick={onBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className={`bg-white dark:bg-neutral-900 rounded-md p-4 w-full max-w-lg ${className || ""}`}>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-2">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold">{children}</h3>;
}



