'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ROLE_OPTIONS = [
  { value: 'ALL', label: 'All roles' },
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'ILO', label: 'ILO / Supervisor' },
  { value: 'MENTOR', label: 'Mentor' },
  { value: 'TRAINEE', label: 'Trainee' },
];

export function UserRoleFilter({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const params = new URLSearchParams();
        if (next && next !== 'ALL') params.set('role', String(next));
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      }}
    >
      <SelectTrigger className="w-44" aria-label="Filter users by role">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
