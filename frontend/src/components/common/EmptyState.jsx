import Card from './Card';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-brand-primary-light flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-brand-primary" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-brand-text mb-1.5">{title}</h3>
      <p className="text-brand-text-secondary text-sm max-w-md mb-5">{description}</p>
      {action}
    </Card>
  );
}
