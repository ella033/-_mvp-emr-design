import Image from "next/image";

const HomePage = () => {
  return (
    <div className="flex flex-col justify-center items-center w-full h-full bg-[var(--background)]">
      <Image
        src="/ubcare_logo.png"
        alt="logo"
        width={100}
        height={100}
        className="transition-all duration-700 hover:scale-110"
        priority
      />
      <div>Home</div>
    </div>
  );
};

export default HomePage;
