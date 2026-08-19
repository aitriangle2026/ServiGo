import { NavLink } from "react-router-dom";

function Sidebar({ links }) {
  return (
    <aside className="hidden w-72 shrink-0 space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40 lg:block">
      <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Dashboard</div>
      <div className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 text-sm font-medium ${isActive ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}

export default Sidebar;
