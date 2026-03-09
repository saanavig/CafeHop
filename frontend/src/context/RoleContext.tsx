import React, { createContext, useContext, useState } from "react";

type Role = "customer" | "cafe";

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  toggleRole: () => void;
}

const RoleContext = createContext<RoleContextType>({
  role: "customer",
  setRole: () => {},
  toggleRole: () => {},
});

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>("customer");

  const toggleRole = () => setRole((prev) => (prev === "customer" ? "cafe" : "customer"));

  return (
    <RoleContext.Provider value={{ role, setRole, toggleRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);
