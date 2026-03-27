export const BundleDetailTitleContainer = ({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) => {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="text-base font-bold">{title}</div>
      {children && children}
    </div>
  );
};
