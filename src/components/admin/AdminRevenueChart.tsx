import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface Props {
  data: Array<{ date: string; revenue: number }>;
}

export default function AdminRevenueChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ color: 'hsl(var(--primary))' }}>Tren Pendapatan (7 Hari)</CardTitle>
        <CardDescription>Ringkasan total pendapatan harian</CardDescription>
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


