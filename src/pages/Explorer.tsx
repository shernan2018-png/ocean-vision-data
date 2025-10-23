import { useState, useEffect } from 'react';
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

interface Country {
  id: string;
  text: string;
}

const Explorer = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [reporters, setReporters] = useState<Country[]>([]);
  const [partners, setPartners] = useState<Country[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  
  // Seafood and Crustaceans HS Codes
  const seafoodHSCodes = [
    { id: '03', text: '03 - Fish and aquatic invertebrates' },
    { id: '0301', text: '0301 - Live fish' },
    { id: '0302', text: '0302 - Fresh or chilled fish' },
    { id: '0303', text: '0303 - Frozen fish' },
    { id: '0304', text: '0304 - Fish fillets and other fish meat' },
    { id: '0305', text: '0305 - Dried, salted or smoked fish' },
    { id: '0306', text: '0306 - Crustaceans' },
    { id: '030611', text: '030611 - Rock lobster/Spiny lobster (Panulirus spp.)' },
    { id: '030612', text: '030612 - Lobsters (Homarus spp.)' },
    { id: '030613', text: '030613 - Shrimps and prawns' },
    { id: '030614', text: '030614 - Crabs' },
    { id: '030615', text: '030615 - Norway lobsters (Nephrops norvegicus)' },
    { id: '030616', text: '030616 - Cold-water shrimps and prawns' },
    { id: '030617', text: '030617 - Other shrimps and prawns' },
    { id: '030619', text: '030619 - Other crustaceans' },
    { id: '030621', text: '030621 - Rock lobster/Spiny lobster (frozen)' },
    { id: '030622', text: '030622 - Lobsters (frozen)' },
    { id: '030623', text: '030623 - Shrimps and prawns (frozen)' },
    { id: '030624', text: '030624 - Crabs (frozen)' },
    { id: '030625', text: '030625 - Norway lobsters (frozen)' },
    { id: '030626', text: '030626 - Cold-water shrimps and prawns (frozen)' },
    { id: '030627', text: '030627 - Other shrimps and prawns (frozen)' },
    { id: '030631', text: '030631 - Rock lobster/Spiny lobster (live/fresh/chilled)' },
    { id: '030632', text: '030632 - Lobsters (live/fresh/chilled)' },
    { id: '030633', text: '030633 - Crabs (live/fresh/chilled)' },
    { id: '030634', text: '030634 - Norway lobsters (live/fresh/chilled)' },
    { id: '030635', text: '030635 - Cold-water shrimps and prawns (live/fresh/chilled)' },
    { id: '030636', text: '030636 - Other shrimps and prawns (live/fresh/chilled)' },
    { id: '0307', text: '0307 - Molluscs' },
    { id: '030711', text: '030711 - Oysters (live/fresh/chilled)' },
    { id: '030712', text: '030712 - Scallops (live/fresh/chilled)' },
    { id: '030713', text: '030713 - Mussels (live/fresh/chilled)' },
    { id: '030714', text: '030714 - Cuttlefish and squid (live/fresh/chilled)' },
    { id: '030715', text: '030715 - Octopus (live/fresh/chilled)' },
    { id: '030716', text: '030716 - Clams, cockles and ark shells (live/fresh/chilled)' },
    { id: '030717', text: '030717 - Abalone (live/fresh/chilled)' },
    { id: '030719', text: '030719 - Other molluscs (live/fresh/chilled)' },
    { id: '030721', text: '030721 - Scallops (frozen)' },
    { id: '030722', text: '030722 - Mussels (frozen)' },
    { id: '030723', text: '030723 - Oysters (frozen)' },
    { id: '030724', text: '030724 - Cuttlefish and squid (frozen)' },
    { id: '030725', text: '030725 - Octopus (frozen)' },
    { id: '030726', text: '030726 - Clams, cockles and ark shells (frozen)' },
    { id: '030727', text: '030727 - Abalone (frozen)' },
    { id: '030729', text: '030729 - Other molluscs (frozen)' },
    { id: '0308', text: '0308 - Aquatic invertebrates' },
    { id: '030811', text: '030811 - Sea cucumbers (live/fresh/chilled)' },
    { id: '030812', text: '030812 - Sea urchins (live/fresh/chilled)' },
    { id: '030819', text: '030819 - Other aquatic invertebrates (live/fresh/chilled)' },
    { id: '030821', text: '030821 - Sea cucumbers (frozen)' },
    { id: '030822', text: '030822 - Sea urchins (frozen)' },
    { id: '030829', text: '030829 - Other aquatic invertebrates (frozen)' },
  ];
  
  const [filters, setFilters] = useState({
    reporterCode: '36', // Australia
    partnerCode: '156', // China
    cmdCode: '030631', // Shrimp
    flowCode: '1', // Export
    freq: 'M', // Monthly
    period: '2022-01', // Format: YYYY for full year, YYYY-MM for single month
  });

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [reportersRes, partnersRes] = await Promise.all([
          supabase.functions.invoke('comtrade-catalogs', { body: { type: 'reporters' } }),
          supabase.functions.invoke('comtrade-catalogs', { body: { type: 'partners' } })
        ]);

        if (reportersRes.data?.results) {
          setReporters(reportersRes.data.results);
        }
        if (partnersRes.data?.results) {
          setPartners(partnersRes.data.results);
        }
      } catch (error) {
        console.error('Error fetching catalogs:', error);
        toast({
          title: t('common.error'),
          description: 'Failed to load country lists',
          variant: 'destructive',
        });
      } finally {
        setLoadingCatalogs(false);
      }
    };

    fetchCatalogs();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('comtrade-data', {
        body: filters
      });

      if (error) throw error;

      console.log('API Response:', data);

      // Transform data for chart - the API returns data in 'data' array
      const apiData = data?.data || [];
      const transformed = apiData.map((item: any) => {
        const periodStr = String(item.period);
        const year = periodStr.substring(0, 4);
        const month = periodStr.length >= 6 ? periodStr.substring(4, 6) : '';
        
        return {
          period: item.period,
          year,
          month,
          refPeriod: item.refPeriodDesc,
          reporter: item.reporterDesc,
          partner: item.partnerDesc,
          commodity: item.cmdDesc,
          flow: item.flowDesc,
          value: item.primaryValue || 0,
          quantity: item.netWgt || 0,
          qtyUnit: item.qtyUnitAbbr,
        };
      });

      setChartData(transformed);
      
      toast({
        title: 'Success',
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
              <Select 
                value={filters.reporterCode} 
                onValueChange={(value) => setFilters({ ...filters, reporterCode: value })}
                disabled={loadingCatalogs}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCatalogs ? "Loading..." : "Select country"} />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {reporters.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="partner">{t('explorer.partner')}</Label>
              <Select 
                value={filters.partnerCode} 
                onValueChange={(value) => setFilters({ ...filters, partnerCode: value })}
                disabled={loadingCatalogs}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCatalogs ? "Loading..." : "Select partner"} />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {partners.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hsCode">{t('explorer.hsCode')}</Label>
              <Select 
                value={filters.cmdCode} 
                onValueChange={(value) => setFilters({ ...filters, cmdCode: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select HS Code" />
                </SelectTrigger>
                <SelectContent className="bg-background max-h-[300px]">
                  {seafoodHSCodes.map((code) => (
                    <SelectItem key={code.id} value={code.id}>
                      {code.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="flow">{t('explorer.flow')}</Label>
              <Select value={filters.flowCode} onValueChange={(value) => setFilters({ ...filters, flowCode: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="1">Export</SelectItem>
                  <SelectItem value="2">Import</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="freq">{t('explorer.frequency')}</Label>
              <Select value={filters.freq} onValueChange={(value) => setFilters({ ...filters, freq: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
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
                placeholder="2022 or 2022-01"
                title="Format: YYYY for full year (e.g., 2022) or YYYY-MM for single month (e.g., 2022-01)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter YYYY for full year or YYYY-MM for specific month
              </p>
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
          <>
            <Card className="p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Data Preview</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Year</th>
                      <th className="text-left p-2 font-semibold">Month</th>
                      <th className="text-left p-2 font-semibold">Commodity</th>
                      <th className="text-left p-2 font-semibold">Flow</th>
                      <th className="text-right p-2 font-semibold">Value (USD)</th>
                      <th className="text-right p-2 font-semibold">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.slice(0, 10).map((row: any, idx: number) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="p-2">{row.year}</td>
                        <td className="p-2">{row.month || '-'}</td>
                        <td className="p-2 text-sm">{row.commodity}</td>
                        <td className="p-2">{row.flow}</td>
                        <td className="p-2 text-right font-mono">{row.value.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono">{row.quantity.toLocaleString()} {row.qtyUnit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {chartData.length > 10 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing 10 of {chartData.length} records
                  </p>
                )}
              </div>
            </Card>

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
          </>
        )}
      </div>
    </div>
  );
};

export default Explorer;
