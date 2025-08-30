interface WelcomeBannerProps {
  studentName: string;
  t: any;
}

export function WelcomeBanner({ studentName, t }: WelcomeBannerProps) {
  return (
    <div className="bg-gradient-academic rounded-xl p-6 text-primary-foreground shadow-academic">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-bold">
          {typeof t.welcomeBack === 'function' ? t.welcomeBack(studentName) : `${t.welcomeBack}, ${studentName}!`}
        </h2>
        <span className="text-xl">👋</span>
      </div>
      <p className="text-primary-foreground/80">
        {t.welcomeMessage}
      </p>
    </div>
  );
}