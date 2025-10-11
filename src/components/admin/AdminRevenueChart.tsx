import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';

type Range = 'weekly' | 'monthly' | 'yearly';

interface Props {
  data: Array<{ date: string; revenue: number }>;
  range: Range;
  onRangeChange?: (r: Range) => void;
}

export default function AdminRevenueChart({ data, range, onRangeChange }: Props) {
  const title = range === 'weekly' ? 'Tren Pendapatan (Mingguan)' : range === 'monthly' ? 'Tren Pendapatan (Bulanan)' : 'Tren Pendapatan (Tahunan)';
  const description = range === 'weekly' ? 'Ringkasan total pendapatan harian' : range === 'monthly' ? 'Ringkasan total pendapatan per minggu' : 'Ringkasan total pendapatan per bulan';

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-4">
        <div>
          <CardTitle style={{ color: 'hsl(var(--primary))' }}>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={range === 'weekly' ? 'default' : 'ghost'} onClick={() => onRangeChange?.('weekly')}>Mingguan</Button>
          <Button size="sm" variant={range === 'monthly' ? 'default' : 'ghost'} onClick={() => onRangeChange?.('monthly')}>Bulanan</Button>
          <Button size="sm" variant={range === 'yearly' ? 'default' : 'ghost'} onClick={() => onRangeChange?.('yearly')}>Tahunan</Button>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ revenue: { label: 'Pendapatan', color: 'hsl(var(--primary))' } }}
          className="w-full min-w-0"
        >
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(v) => v.toLocaleString('id-ID')} width={60} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}


