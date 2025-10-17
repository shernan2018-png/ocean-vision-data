import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Save, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Explorer = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({
    reporterCode: '36', // Australia
    partnerCode: '156', // China
    cmdCode: '030631', // Shrimp
    flowCode: '2', // Export
    freq: 'M', // Monthly
    period: '2020-01,2020-12',
  });

  const handleSearch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('comtrade-data', {
        body: filters
      });

      if (error) throw error;

      // Transform data for chart
      const transformed = data?.results?.map((item: any) => ({
        period: item.period,
        value: item.primaryValue || 0,
        quantity: item.netWgt || 0,
      })) || [];

      setChartData(transformed);
      
      toast({
        title: t('common.success') || 'Success',
        description: `${transformed.length} records loaded`,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (chartData.length === 0) return;

    const csvContent = [
      ['Period', 'Value (USD)', 'Quantity (kg)'],
      ...chartData.map(row => [row.period, row.value, row.quantity])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-data-${Date.now()}.csv`;
    a.click();
  };

  const handleSaveQuery = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to save queries',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.from('saved_queries').insert({
        user_id: user.id,
        name: `Query ${new Date().toLocaleDateString()}`,
        reporter_code: filters.reporterCode,
        partner_code: filters.partnerCode,
        hs_code: filters.cmdCode,
        flow_code: filters.flowCode,
        frequency: filters.freq,
        period_start: filters.period.split(',')[0],
        period_end: filters.period.split(',')[1],
      });

      if (error) throw error;

      toast({
        title: 'Query saved',
        description: 'Your query has been saved successfully',
      });
    } catch (error) {
      console.error('Error saving query:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to save query',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-ocean bg-clip-text text-transparent">
          {t('explorer.title')}
        </h1>

        <Card className="p-6 mb-8 shadow-ocean">
          <h2 className="text-xl font-semibold mb-4">{t('explorer.filters')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="reporter">{t('explorer.reporter')}</Label>
              <Input
                id="reporter"
                value={filters.reporterCode}
                onChange={(e) => setFilters({ ...filters, reporterCode: e.target.value })}
                placeholder="36 (Australia)"
              />
            </div>

            <div>
              <Label htmlFor="partner">{t('explorer.partner')}</Label>
              <Input
                id="partner"
                value={filters.partnerCode}
                onChange={(e) => setFilters({ ...filters, partnerCode: e.target.value })}
                placeholder="156 (China)"
              />
            </div>

            <div>
              <Label htmlFor="hsCode">{t('explorer.hsCode')}</Label>
              <Select value={filters.cmdCode} onValueChange={(value) => setFilters({ ...filters, cmdCode: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="030631">030631 - Shrimps/Prawns</SelectItem>
                  <SelectItem value="0302">0302 - Fresh Fish</SelectItem>
                  <SelectItem value="0303">0303 - Frozen Fish</SelectItem>
                  <SelectItem value="0306">0306 - Crustaceans</SelectItem>
                  <SelectItem value="0307">0307 - Molluscs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="flow">{t('explorer.flow')}</Label>
              <Select value={filters.flowCode} onValueChange={(value) => setFilters({ ...filters, flowCode: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Import</SelectItem>
                  <SelectItem value="2">Export</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="freq">{t('explorer.frequency')}</Label>
              <Select value={filters.freq} onValueChange={(value) => setFilters({ ...filters, freq: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Annual</SelectItem>
                  <SelectItem value="M">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="period">{t('explorer.period')}</Label>
              <Input
                id="period"
                value={filters.period}
                onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                placeholder="2020-01,2020-12"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading} className="gap-2">
              <Search className="h-4 w-4" />
              {loading ? t('common.loading') : t('common.search')}
            </Button>
            <Button variant="outline" onClick={handleSaveQuery} className="gap-2">
              <Save className="h-4 w-4" />
              {t('explorer.saveQuery')}
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={chartData.length === 0} className="gap-2">
              <Download className="h-4 w-4" />
              {t('common.export')}
            </Button>
          </div>
        </Card>

        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Trade Value Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quantity Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity" fill="hsl(var(--secondary))" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explorer;
