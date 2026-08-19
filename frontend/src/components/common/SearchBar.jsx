import { FaSearch } from "react-icons/fa";

const SearchBar = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Search for a service (e.g. plumbing, cleaning...)",
  className = "",
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex w-full items-center gap-2 rounded-2xl bg-white/95 p-2 shadow-lg ring-1 ring-black/5 backdrop-blur-md ${className}`}
    >
      <div className="flex flex-1 items-center gap-3 px-3">
        <FaSearch className="text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent py-3 text-sm text-secondary placeholder:text-slate-400 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="whitespace-nowrap rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.98]"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;