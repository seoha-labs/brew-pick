import type { Franchise, MenuItem } from '../types';

const BASE_URL = import.meta.env.BASE_URL;

export const loadFranchises = async (): Promise<readonly Franchise[]> => {
  const res = await fetch(`${BASE_URL}data/franchises.json`);
  return res.json();
};

export const loadMenu = async (
  franchiseId: string,
): Promise<readonly MenuItem[]> => {
  const res = await fetch(`${BASE_URL}data/${franchiseId}.json`);
  return res.json();
};
