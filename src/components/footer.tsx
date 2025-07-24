const Footer = () => {
  return (
    <footer className="bg-gray-100 text-gray-700 text-m mt-10 p-7 border-t border-gray-300">
      <div className="flex flex-col items-center justify-center space-y-1">
        <p className="text-blue-700">© 2025 BIRL — This website is free and open to all users and there is no login requirement.</p>
        <a
          className="font-semibold text-blue-700"
          href="https://birl.lums.edu.pk/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Biomedical Informatics & Engineering Research Laboratory,
        </a>
        <p className="text-blue-700">Lahore University of Management Sciences, DHA, Lahore, Pakistan</p>
        <p className="text-blue-700">+92 (42) 3560 8352</p>
      </div>
    </footer>
  );
};

export default Footer;