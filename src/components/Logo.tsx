import { cn } from '@/lib/utils';
import artwinLogo from '@/assets/artwin-logo.png';
interface LogoProps {
  className?: string;
}
export const Logo = ({
  className
}: LogoProps) => {
  return <div className={cn('flex items-center gap-2', className)}>
      <img src={artwinLogo} alt="Artwin" className="h-8 object-contain" />
      <span className="text-lg font-medium text-muted-foreground">Команда качества</span>
    </div>;
};