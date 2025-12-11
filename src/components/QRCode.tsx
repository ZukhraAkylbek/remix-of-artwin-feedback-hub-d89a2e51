import { QrCode } from 'lucide-react';

export const QRCode = () => {
  return (
    <div className="w-32 h-32 bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-border">
      <QrCode className="w-16 h-16 text-muted-foreground" />
    </div>
  );
};
