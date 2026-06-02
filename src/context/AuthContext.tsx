import React, {createContext, useContext, useState} from 'react';
import {ClienteData, DespachanteData} from '../services/api';

export type EmpresaData = {
  id: string;
  nome_empresa: string;
  cnpj: string;
  nome_responsavel: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  horario_funcionamento?: string;
  status_assinatura: string;
};

type AuthContextType = {
  empresa: EmpresaData | null;
  setEmpresa: (e: EmpresaData | null) => void;
  cliente: ClienteData | null;
  setCliente: (c: ClienteData | null) => void;
  despachante: DespachanteData | null;
  setDespachante: (d: DespachanteData | null) => void;
};

const AuthContext = createContext<AuthContextType>({empresa: null, setEmpresa: () => {}, cliente: null, setCliente: () => {}, despachante: null, setDespachante: () => {}});

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [empresa, setEmpresa] = useState<EmpresaData | null>(null);
  const [cliente, setCliente] = useState<ClienteData | null>(null);
  const [despachante, setDespachante] = useState<DespachanteData | null>(null);
  return (
    <AuthContext.Provider value={{empresa, setEmpresa, cliente, setCliente, despachante, setDespachante}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
