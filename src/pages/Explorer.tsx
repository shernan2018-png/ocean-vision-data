import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Save, Search, FileSpreadsheet, TrendingUp, Star } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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
    periodStart: new Date(2022, 0), // January 2022
    periodEnd: new Date(2022, 11), // December 2022
    yearStart: 2022, // For annual frequency
    yearEnd: 2022, // For annual frequency
  });

  // Forecast states
  const [forecastInputs, setForecastInputs] = useState({
    reporterCode: '36', // Australia
    partnerCode: '156', // China
    cmdCode: '030631', // Shrimp
    baseVariable: 'reporter', // reporter or partner
    flowCode: '1', // Export
    freq: 'M', // Monthly
    periodStart: new Date(2022, 0), // January 2022
    periodEnd: new Date(2022, 11), // December 2022
    yearStart: 2022,
    yearEnd: 2022,
    additionalCountries: ['none', 'none', 'none', 'none'], // Up to 4 additional countries
    horizon: '3',
  });
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [priceChartData, setPriceChartData] = useState<any[]>([]);
  const [loadingPriceChart, setLoadingPriceChart] = useState(false);
  const [priceForecastData, setPriceForecastData] = useState<any[]>([]);
  const [selectedReporter, setSelectedReporter] = useState<Country | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Country | null>(null);
  const [selectedFirstCountry, setSelectedFirstCountry] = useState<Country | null>(null);
  const [selectedSecondCountry, setSelectedSecondCountry] = useState<Country | null>(null);
  const [selectedThirdCountry, setSelectedThirdCountry] = useState<Country | null>(null);
  const [selectedFourthCountry, setSelectedFourthCountry] = useState<Country | null>(null);

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
      // Format period based on frequency
      let period: string;
      
      if (filters.freq === 'A') {
        // Annual frequency: range of years
        if (filters.yearStart === filters.yearEnd) {
          period = filters.yearStart.toString();
        } else {
          const years: string[] = [];
          for (let year = filters.yearStart; year <= filters.yearEnd; year++) {
            years.push(year.toString());
          }
          period = years.join(',');
        }
      } else {
        // Monthly frequency: range of months
        const startYear = filters.periodStart.getFullYear();
        const startMonth = filters.periodStart.getMonth();
        const endYear = filters.periodEnd.getFullYear();
        const endMonth = filters.periodEnd.getMonth();
        
        const periods: string[] = [];
        let currentDate = new Date(startYear, startMonth);
        const endDate = new Date(endYear, endMonth);
        
        while (currentDate <= endDate) {
          const yearStr = currentDate.getFullYear().toString();
          const monthStr = (currentDate.getMonth() + 1).toString().padStart(2, '0');
          periods.push(`${yearStr}-${monthStr}`);
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        period = periods.join(',');
      }

      console.log('Total periods requested:', period.split(',').length);

      // Split periods into chunks of 12 (Comtrade API limit)
      const periodList = period.split(',');
      const periodChunks: string[] = [];
      
      for (let i = 0; i < periodList.length; i += 12) {
        const chunk = periodList.slice(i, i + 12);
        periodChunks.push(chunk.join(','));
      }
      
      console.log(`Divided into ${periodChunks.length} chunks`);

      // Fetch data for each chunk
      const allApiData: any[] = [];
      
      for (let chunkIndex = 0; chunkIndex < periodChunks.length; chunkIndex++) {
        const chunkPeriod = periodChunks[chunkIndex];
        
        console.log(`Fetching chunk ${chunkIndex + 1}/${periodChunks.length}...`);
        
        // Add delay between chunks (2 seconds)
        if (chunkIndex > 0) {
          console.log(`Waiting 2 seconds before next chunk...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const { data, error } = await supabase.functions.invoke('comtrade-data', {
          body: {
            reporterCode: filters.reporterCode,
            partnerCode: filters.partnerCode,
            cmdCode: filters.cmdCode,
            flowCode: filters.flowCode,
            freq: filters.freq,
            period: chunkPeriod
          }
        });

        if (error) {
          console.error(`Error in chunk ${chunkIndex + 1}:`, error);
          throw error;
        }

        const chunkData = data?.data || [];
        console.log(`Chunk ${chunkIndex + 1} received ${chunkData.length} records`);
        allApiData.push(...chunkData);
      }

      console.log('Total API data received:', allApiData.length, 'records');

      // Transform data for chart - the API returns data in 'data' array
      const transformed = allApiData.map((item: any) => {
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

      // Remove duplicates based on period
      const uniqueData = transformed.filter((item, index, self) =>
        index === self.findIndex((t) => t.period === item.period)
      );

      // Sort by period (ascending order)
      const sortedData = uniqueData.sort((a, b) => {
        const periodA = String(a.period);
        const periodB = String(b.period);
        return periodA.localeCompare(periodB);
      });

      console.log('📊 Data sorted by period:', sortedData.map(d => d.period));

      setChartData(sortedData);
      
      toast({
        title: 'Success',
        description: `${uniqueData.length} records loaded`,
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
      ['Year', 'Month', 'Commodity', 'Reporting Country', 'Flow', 'Partner Country', 'Value (USD)', 'Quantity (kg)', 'Unit Price'],
      ...chartData.map(row => {
        const unitPrice = row.quantity > 0 ? (row.value / row.quantity).toFixed(2) : 'N/A';
        return [row.year, row.month || '-', row.commodity, row.reporter, row.flow, row.partner, row.value, row.quantity, unitPrice];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-data-${Date.now()}.csv`;
    a.click();
  };

  const handleExportExcel = () => {
    if (chartData.length === 0) return;

    const excelData = chartData.map(row => {
      const unitPrice = row.quantity > 0 ? (row.value / row.quantity).toFixed(2) : 'N/A';
      return {
        'Year': row.year,
        'Month': row.month || '-',
        'Commodity': row.commodity,
        'Reporting Country': row.reporter,
        'Flow': row.flow,
        'Partner Country': row.partner,
        'Value (USD)': row.value,
        'Quantity (kg)': row.quantity,
        'Unit Price': unitPrice
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trade Data');
    
    XLSX.writeFile(workbook, `export-data-${Date.now()}.xlsx`);
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

      let periodStart: string;
      let periodEnd: string;

      if (filters.freq === 'A') {
        periodStart = filters.yearStart.toString();
        periodEnd = filters.yearEnd.toString();
      } else {
        const yearStart = filters.periodStart.getFullYear();
        const monthStart = (filters.periodStart.getMonth() + 1).toString().padStart(2, '0');
        const yearEnd = filters.periodEnd.getFullYear();
        const monthEnd = (filters.periodEnd.getMonth() + 1).toString().padStart(2, '0');
        periodStart = `${yearStart}-${monthStart}`;
        periodEnd = `${yearEnd}-${monthEnd}`;
      }

      const { error } = await supabase.from('saved_queries').insert({
        user_id: user.id,
        name: `Query ${new Date().toLocaleDateString()}`,
        reporter_code: filters.reporterCode,
        partner_code: filters.partnerCode,
        hs_code: filters.cmdCode,
        flow_code: filters.flowCode,
        frequency: filters.freq,
        period_start: periodStart,
        period_end: periodEnd,
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

  const handleGenerateForecast = async () => {
    setLoadingForecast(true);
    try {
      // Validation
      if (!forecastInputs.reporterCode || !forecastInputs.partnerCode) {
        toast({
          title: 'Error',
          description: 'Por favor selecciona país reportero y país socio',
          variant: 'destructive',
        });
        return;
      }

      const horizon = parseInt(forecastInputs.horizon);
      if (isNaN(horizon) || horizon <= 0) {
        toast({
          title: 'Error',
          description: 'Por favor ingresa un horizonte válido',
          variant: 'destructive',
        });
        return;
      }

      // Build inputs object for the MATLAB model
      // X1 will be the base variable (reporter or partner price)
      // X2-X5 will be the additional countries if selected
      const inputs: any = {};
      
      // For now, we'll pass placeholder arrays since we need historical data
      // In a real implementation, you would fetch this data from your API
      inputs.X1 = [2.3, 2.5, 2.7, 2.8]; // Placeholder for base variable
      
      // Add additional countries as X2-X5
      const validAdditionalCountries = forecastInputs.additionalCountries.filter(c => c !== 'none' && c !== '');
      validAdditionalCountries.forEach((country, index) => {
        inputs[`X${index + 2}`] = [1.0, 1.5, 2.0]; // Placeholder data
      });

      const response = await fetch('https://ophthalmic-rolf-ungallant.ngrok-free.dev/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs,
          horizon,
          lastDate,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al conectar con el servidor de pronósticos');
      }

      const data = await response.json();
      
      // Process forecast data
      const forecastArray = data.forecast || [];
      const horizonArray = data.horizon || [];
      
      const forecastChartData = forecastArray.map((value: number, index: number) => ({
        month: horizonArray[index] || `Mes ${index + 1}`,
        forecast: value,
      }));

      setForecastData(forecastChartData);
      
      toast({
        title: 'Pronóstico generado',
        description: `Se generaron ${forecastArray.length} valores`,
      });
    } catch (error) {
      console.error('Error generating forecast:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al generar pronóstico',
        variant: 'destructive',
      });
    } finally {
      setLoadingForecast(false);
    }
  };

  const handleAdditionalCountryChange = (index: number, value: string) => {
    console.log(`🔄 Changing country at index ${index} to value: ${value} (type: ${typeof value})`);
    const newAdditionalCountries = [...forecastInputs.additionalCountries];
    newAdditionalCountries[index] = value;
    console.log(`🔄 New additional countries array:`, newAdditionalCountries);
    setForecastInputs({ ...forecastInputs, additionalCountries: newAdditionalCountries });
  };

  const handleGeneratePriceForecast = async () => {
    setLoadingForecast(true);

    try {
      let chartDataToUse = priceChartData;
      
      // Si no hay datos graficados, obtenerlos primero
      if (!chartDataToUse || chartDataToUse.length === 0) {
        console.log('No hay datos graficados, obteniendo datos primero...');
        
        // Get all countries to plot (reporter + additional countries)
        const reporter = reporters.find(r => String(r.id) === String(forecastInputs.reporterCode));
        const partner = partners.find(p => String(p.id) === String(forecastInputs.partnerCode));
        
        if (!reporter || !partner) {
          toast({
            title: "Error",
            description: "Por favor selecciona el país reportero y el país socio",
            variant: "destructive",
          });
          setLoadingForecast(false);
          return;
        }

        const filteredAdditional = forecastInputs.additionalCountries.filter(code => {
          return code !== 'none' && code !== '' && code !== null && code !== undefined;
        });
        
        const allCountryCodes = [
          forecastInputs.reporterCode,
          ...filteredAdditional
        ];

        const countriesToPlot = allCountryCodes.map(code => {
          const country = reporters.find(r => String(r.id) === String(code));
          return {
            code: code,
            name: country ? country.text : `Unknown (${code})`
          };
        });

        // Format period
        let period: string;
        if (forecastInputs.freq === 'A') {
          if (forecastInputs.yearStart === forecastInputs.yearEnd) {
            period = forecastInputs.yearStart.toString();
          } else {
            const years: string[] = [];
            for (let year = forecastInputs.yearStart; year <= forecastInputs.yearEnd; year++) {
              years.push(year.toString());
            }
            period = years.join(',');
          }
        } else {
          const startYear = forecastInputs.periodStart.getFullYear();
          const startMonth = forecastInputs.periodStart.getMonth();
          const endYear = forecastInputs.periodEnd.getFullYear();
          const endMonth = forecastInputs.periodEnd.getMonth();
          
          const periods: string[] = [];
          let currentDate = new Date(startYear, startMonth);
          const endDate = new Date(endYear, endMonth);
          
          while (currentDate <= endDate) {
            const yearStr = currentDate.getFullYear().toString();
            const monthStr = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            periods.push(`${yearStr}-${monthStr}`);
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
          
          period = periods.join(',');
        }

        const periodList = period.split(',');
        const periodChunks: string[] = [];
        
        for (let i = 0; i < periodList.length; i += 12) {
          const chunk = periodList.slice(i, i + 12);
          periodChunks.push(chunk.join(','));
        }

        // Fetch data for each country
        const allCountryData = [];
        
        for (let i = 0; i < countriesToPlot.length; i++) {
          const country = countriesToPlot[i];
          
          try {
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 4000));
            }
            
            const allChunkData: any[] = [];
            
            for (let chunkIndex = 0; chunkIndex < periodChunks.length; chunkIndex++) {
              const chunkPeriod = periodChunks[chunkIndex];
              
              if (chunkIndex > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
              
              const { data, error } = await supabase.functions.invoke('comtrade-data', {
                body: {
                  reporterCode: country.code,
                  partnerCode: forecastInputs.partnerCode,
                  cmdCode: forecastInputs.cmdCode,
                  flowCode: forecastInputs.flowCode,
                  freq: forecastInputs.freq,
                  period: chunkPeriod
                }
              });

              if (error) {
                console.error(`Error fetching data for ${country.name}:`, error);
                continue;
              }

              const chunkApiData = data?.data || [];
              allChunkData.push(...chunkApiData);
            }
            
            const sortedApiData = allChunkData.sort((a: any, b: any) => {
              return String(a.period).localeCompare(String(b.period));
            });
            
            allCountryData.push({
              countryName: country.name,
              countryCode: country.code,
              data: sortedApiData.map((item: any) => ({
                period: item.period,
                unitPrice: item.netWgt > 0 ? (item.primaryValue / item.netWgt) : 0
              }))
            });
          } catch (error) {
            console.error(`Error fetching data for ${country.name}:`, error);
            allCountryData.push({
              countryName: country.name,
              countryCode: country.code,
              data: []
            });
          }
        }

        // Combine all data by period
        const periodMap = new Map<string, any>();
        
        allCountryData.forEach(countryData => {
          if (countryData.data.length > 0) {
            countryData.data.forEach((item: any) => {
              if (!periodMap.has(item.period)) {
                periodMap.set(item.period, { period: item.period });
              }
              const periodData = periodMap.get(item.period);
              periodData[countryData.countryName] = item.unitPrice;
            });
          }
        });

        chartDataToUse = Array.from(periodMap.values()).sort((a, b) => 
          a.period.localeCompare(b.period)
        );

        if (chartDataToUse.length === 0) {
          toast({
            title: "Error",
            description: "No se encontraron datos para generar el pronóstico. Verifica que haya datos disponibles para los países y periodos seleccionados.",
            variant: "destructive",
            duration: 8000,
          });
          setLoadingForecast(false);
          return;
        }
      }

      // Get the base series name (Reporter → Partner)
      const reporter = reporters.find(r => String(r.id) === String(forecastInputs.reporterCode));
      const partner = partners.find(p => String(p.id) === String(forecastInputs.partnerCode));
      
      if (!reporter || !partner) {
        toast({
          title: "Error",
          description: "No se pudo encontrar el país reportero o socio",
          variant: "destructive",
        });
        setLoadingForecast(false);
        return;
      }

      const baseSeriesName = `${reporter.text} → ${partner.text}`;
      
      // 🔍 Debug: Ver qué datos hay disponibles
      console.log('🔍 Diagnóstico de datos disponibles:');
      console.log('📊 chartDataToUse tiene', chartDataToUse.length, 'periodos');
      if (chartDataToUse.length > 0) {
        console.log('📋 Primer registro:', chartDataToUse[0]);
        console.log('🔑 Claves disponibles:', Object.keys(chartDataToUse[0]));
        console.log('🎯 Buscando clave:', baseSeriesName);
      }
      
      // Extract base series (dependent variable) - X1
      // Intentar primero con el formato completo (Reporter → Partner)
      let baseSeries = chartDataToUse
        .map(item => item[baseSeriesName])
        .filter(value => value !== undefined && value !== null && value > 0);
      
      // Si no encuentra datos con el formato "Reporter → Partner", buscar solo con el nombre del reporter
      if (baseSeries.length === 0) {
        console.warn('⚠️ No se encontraron datos con el formato "Reporter → Partner"');
        console.log('🔄 Intentando buscar con solo el nombre del reporter:', reporter.text);
        
        // Buscar cualquier clave que contenga el nombre del reporter
        const availableKeys = chartDataToUse.length > 0 ? Object.keys(chartDataToUse[0]) : [];
        const matchingKey = availableKeys.find(key => 
          key !== 'period' && 
          (key === reporter.text || key.includes(reporter.text))
        );
        
        if (matchingKey) {
          console.log('✅ Encontrada clave alternativa:', matchingKey);
          baseSeries = chartDataToUse
            .map(item => item[matchingKey])
            .filter(value => value !== undefined && value !== null && value > 0);
        } else {
          console.error('❌ No se encontró ninguna clave que coincida con el reporter');
          console.log('📋 Claves disponibles:', availableKeys);
        }
      }
      
      console.log('📊 Serie base extraída:', baseSeries.length, 'valores');
      if (baseSeries.length > 0) {
        console.log('📈 Primeros 5 valores:', baseSeries.slice(0, 5));
      }

      if (baseSeries.length < 3) {
        console.warn(`⚠️ Datos insuficientes: solo ${baseSeries.length} periodos encontrados, se requieren al menos 3`);
        toast({
          title: "Error",
          description: `Se necesitan al menos 3 periodos con datos para generar un pronóstico. Solo se encontraron ${baseSeries.length} periodo(s).`,
          variant: "destructive",
          duration: 8000,
        });
        setLoadingForecast(false);
        return;
      }

      // Build the inputs object for the JSON body
      const inputs: any = {
        X1: baseSeries // Serie de precios del país reportero → socio
      };
      
      // Collect exogenous variables X2-X5 from additional countries (unit prices)
      forecastInputs.additionalCountries.forEach((countryCode, index) => {
        if (countryCode && countryCode !== 'none' && countryCode !== '') {
          const country = reporters.find(r => String(r.id) === String(countryCode));
          if (country) {
            // Use the country name directly (unit prices are stored by country name in chartDataToUse)
            const seriesName = country.text;
            const values = chartDataToUse
              .map(item => item[seriesName])
              .filter(value => value !== undefined && value !== null && value > 0);
            
            if (values.length > 0) {
              inputs[`X${index + 2}`] = values; // X2, X3, X4, X5 = unit prices
              console.log(`✅ Agregada variable X${index + 2} (${seriesName} → ${partner.text}): ${values.length} valores`);
            } else {
              console.warn(`⚠️ No se encontraron datos para X${index + 2} (${seriesName})`);
            }
          }
        }
      });

      // Get the last date from the price chart data
      const lastPeriod = priceChartData[priceChartData.length - 1].period;
      // Convert period format from "202212" to "2022-12"
      const lastDate = `${lastPeriod.substring(0, 4)}-${lastPeriod.substring(4, 6)}`;

      // Build the complete request body
      const requestBody = {
        inputs,
        horizon: parseInt(forecastInputs.horizon),
        lastDate
      };

      // ========== LOGS DETALLADOS PARA VERIFICAR SERIES ==========
      console.log('\n🔍 ========== VERIFICACIÓN DE SERIES ==========');
      console.log('📊 Total de series a enviar:', Object.keys(inputs).length);
      console.log('\n');
      
      // Mostrar X1 (serie base)
      console.log('📈 X1 (Serie base: País Reportero → País Socio)');
      console.log(`   País: ${reporter.text} → ${partner.text}`);
      console.log(`   Número de valores: ${inputs.X1.length}`);
      console.log(`   Valores:`, inputs.X1);
      console.log(`   Primer valor: ${inputs.X1[0]}`);
      console.log(`   Último valor: ${inputs.X1[inputs.X1.length - 1]}`);
      console.log('\n');
      
      // Mostrar X2-X5 (variables exógenas - precios unitarios)
      const exogenousKeys = Object.keys(inputs).filter(k => k !== 'X1').sort();
      if (exogenousKeys.length > 0) {
        console.log('📊 Variables Exógenas (Precios Unitarios):');
        exogenousKeys.forEach(key => {
          const country = forecastInputs.additionalCountries[parseInt(key.substring(1)) - 2];
          const countryName = reporters.find(r => String(r.id) === String(country))?.text || 'Desconocido';
          console.log(`\n   ${key} (${countryName} → ${partner.text}) [Precio Unitario]`);
          console.log(`   Número de valores: ${inputs[key].length}`);
          console.log(`   Valores:`, inputs[key]);
          console.log(`   Primer valor: ${inputs[key][0]}`);
          console.log(`   Último valor: ${inputs[key][inputs[key].length - 1]}`);
        });
      } else {
        console.log('⚠️ No hay variables exógenas (X2-X5)');
      }
      
      console.log('\n📦 JSON completo que se enviará:');
      console.log(JSON.stringify(requestBody, null, 2));
      console.log('🔍 ========================================\n');
      // ========== FIN DE LOGS DETALLADOS ==========

      // Invoke Edge Function
      console.log('🚀 Invocando Edge Function: forecast');
      console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));
      
      let forecastResult;
      try {
        const { data, error } = await supabase.functions.invoke('forecast', {
          body: requestBody,
        });

        console.log('\n🔍 ========== RESPUESTA DE EDGE FUNCTION ==========');
        if (error) {
          console.error('❌ Error desde Edge Function:', error);
          throw new Error(`Error del servidor de pronósticos: ${error.message}`);
        }

        console.log('✅ Edge Function respondió exitosamente');
        console.log('📦 Data recibida:', JSON.stringify(data, null, 2));
        console.log('📈 Tipo:', typeof data);
        console.log('📈 Es Array:', Array.isArray(data));
        console.log('🔍 ================================================\n');

        forecastResult = data;
      } catch (invokeError) {
        console.error('❌ Error invocando Edge Function:', invokeError);
        throw new Error('No se pudo invocar la Edge Function de pronósticos. Verifica que esté desplegada.');
      }

      // Verify that the server returns an array with period and value
      if (!Array.isArray(forecastResult) || forecastResult.length === 0) {
        throw new Error('No se recibieron resultados válidos del modelo.');
      }

      // Verify that each object has period and value
      const isValidFormat = forecastResult.every(
        item => item && typeof item === 'object' && 'period' in item && 'value' in item
      );

      if (!isValidFormat) {
        throw new Error('No se recibieron resultados válidos del modelo.');
      }

      // Use the data directly from the server response
      const forecastArray: { period: string; forecast: number; lower: number; upper: number }[] = 
        forecastResult.map((item: { period: string; value: number }) => {
          // Calculate confidence intervals (simple ±15%)
          const forecastValue = Math.max(0, item.value);
          const lower = Math.max(0, forecastValue * 0.85);
          const upper = forecastValue * 1.15;
          
          return {
            period: item.period,
            forecast: forecastValue,
            lower,
            upper
          };
        });

      setPriceForecastData(forecastArray);

      const exoCount = Object.keys(inputs).length - 1; // Exclude X1
      toast({
        title: "Pronóstico generado",
        description: `Se generó un pronóstico para los próximos ${forecastArray.length} periodos usando ${exoCount} variable(s) exógena(s)`,
      });

    } catch (error) {
      console.error('❌ Error completo al generar pronóstico:', error);
      console.error('❌ Tipo de error:', error instanceof Error ? error.constructor.name : typeof error);
      
      let errorMessage = "No se pudo generar el pronóstico";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('❌ Mensaje de error:', error.message);
        console.error('❌ Stack trace:', error.stack);
      }
      
      toast({
        title: "Error al generar pronóstico",
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // 10 segundos para que puedas leer el error
      });
    } finally {
      setLoadingForecast(false);
    }
  };

  // Helper function to get next period
  const getNextPeriod = (currentPeriod: string, offset: number): string => {
    const year = parseInt(currentPeriod.substring(0, 4));
    const month = parseInt(currentPeriod.substring(4, 6));
    
    const totalMonths = (year * 12 + month - 1) + offset;
    const newYear = Math.floor(totalMonths / 12);
    const newMonth = (totalMonths % 12) + 1;
    
    return `${newYear}${newMonth.toString().padStart(2, '0')}`;
  };

  const handlePlotPrices = async () => {
    setLoadingPriceChart(true);
    try {
      // Get all countries to plot (reporter + additional countries that are not 'none')
      console.log('📋 Reporter code:', forecastInputs.reporterCode, 'Type:', typeof forecastInputs.reporterCode);
      console.log('📋 Additional countries RAW:', forecastInputs.additionalCountries);
      console.log('📋 Reporters array sample (first 5):', reporters.slice(0, 5).map(r => ({ id: r.id, type: typeof r.id, text: r.text })));
      console.log('📋 Looking for Mexico (484):', reporters.find(r => String(r.id) === '484'));
      console.log('📋 Looking for Japan (392):', reporters.find(r => String(r.id) === '392'));
      
      const filteredAdditional = forecastInputs.additionalCountries.filter(code => {
        const isValid = code !== 'none' && code !== '' && code !== null && code !== undefined;
        return isValid;
      });
      
      console.log('📋 Filtered additional countries:', filteredAdditional);
      
      const allCountryCodes = [
        forecastInputs.reporterCode,
        ...filteredAdditional
      ];

      console.log('📋 All countries to plot:', allCountryCodes);
      console.log('📋 Number of countries to fetch:', allCountryCodes.length);

      // Get country names from the reporters catalog
      const countriesToPlot = allCountryCodes.map(code => {
        const country = reporters.find(r => String(r.id) === String(code));
        if (!country) {
          console.log(`❌ Could not find country with code: ${code}`);
        } else {
          console.log(`✅ Found country: ${country.text} (${code})`);
        }
        return {
          code: code,
          name: country ? country.text : `Unknown (${code})`
        };
      });

      console.log('📋 Final countries to plot (TOTAL:', countriesToPlot.length, '):', countriesToPlot);
      console.log('🌍 Países a graficar:', countriesToPlot.map(c => `${c.name} (${c.code})`).join(', '));

      // Format period based on frequency
      let period: string;
      
      if (forecastInputs.freq === 'A') {
        if (forecastInputs.yearStart === forecastInputs.yearEnd) {
          period = forecastInputs.yearStart.toString();
        } else {
          const years: string[] = [];
          for (let year = forecastInputs.yearStart; year <= forecastInputs.yearEnd; year++) {
            years.push(year.toString());
          }
          period = years.join(',');
        }
      } else {
        const startYear = forecastInputs.periodStart.getFullYear();
        const startMonth = forecastInputs.periodStart.getMonth();
        const endYear = forecastInputs.periodEnd.getFullYear();
        const endMonth = forecastInputs.periodEnd.getMonth();
        
        const periods: string[] = [];
        let currentDate = new Date(startYear, startMonth);
        const endDate = new Date(endYear, endMonth);
        
        while (currentDate <= endDate) {
          const yearStr = currentDate.getFullYear().toString();
          const monthStr = (currentDate.getMonth() + 1).toString().padStart(2, '0');
          periods.push(`${yearStr}-${monthStr}`);
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        period = periods.join(',');
      }

      console.log('Period:', period);
      console.log('Total periods requested:', period.split(',').length);

      // Split periods into chunks of 12 (Comtrade API limit)
      const periodList = period.split(',');
      const periodChunks: string[] = [];
      
      for (let i = 0; i < periodList.length; i += 12) {
        const chunk = periodList.slice(i, i + 12);
        periodChunks.push(chunk.join(','));
      }
      
      console.log(`Divided into ${periodChunks.length} chunks:`, periodChunks.map(c => c.split(',').length + ' periods'));

      console.log('🚀 Countries to fetch:', countriesToPlot.map(c => `${c.name}(${c.code})`).join(', '));

      // Fetch data for each country SEQUENTIALLY with delay to avoid rate limiting
      const allCountryData = [];
      
      for (let i = 0; i < countriesToPlot.length; i++) {
        const country = countriesToPlot[i];
        
        console.log(`\n🔄 [${i + 1}/${countriesToPlot.length}] Processing: ${country.name} (${country.code})`);
        
        try {
          
          // Add delay between countries (4 seconds) to avoid rate limiting
          if (i > 0) {
            console.log(`Waiting 4 seconds before next country...`);
            await new Promise(resolve => setTimeout(resolve, 4000));
          }
          
          // Fetch data for each period chunk
          const allChunkData: any[] = [];
          
          for (let chunkIndex = 0; chunkIndex < periodChunks.length; chunkIndex++) {
            const chunkPeriod = periodChunks[chunkIndex];
            
            console.log(`  Chunk ${chunkIndex + 1}/${periodChunks.length} for ${country.name}`);
            
            // Add delay between chunks (2 seconds)
            if (chunkIndex > 0) {
              console.log(`  Waiting 2 seconds before next chunk...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            const { data, error } = await supabase.functions.invoke('comtrade-data', {
              body: {
                reporterCode: country.code,
                partnerCode: forecastInputs.partnerCode,
                cmdCode: forecastInputs.cmdCode,
                flowCode: forecastInputs.flowCode,
                freq: forecastInputs.freq,
                period: chunkPeriod
              }
            });

            if (error) {
              console.error(`  ❌ Error in chunk ${chunkIndex + 1} for ${country.name}:`, error);
              continue;
            }

            const chunkApiData = data?.data || [];
            console.log(`  ✓ Chunk ${chunkIndex + 1} received ${chunkApiData.length} records`);
            allChunkData.push(...chunkApiData);
          }
          
          console.log(`✓ Total data received for ${country.name}:`, allChunkData.length, 'records');
          
          if (allChunkData.length === 0) {
            console.warn(`⚠️ No data found for ${country.name}`);
          }
          
          // Sort data by period before processing
          const sortedApiData = allChunkData.sort((a: any, b: any) => {
            const periodA = String(a.period);
            const periodB = String(b.period);
            return periodA.localeCompare(periodB);
          });
          
          allCountryData.push({
            countryName: country.name,
            countryCode: country.code,
            data: sortedApiData.map((item: any) => ({
              period: item.period,
              unitPrice: item.netWgt > 0 ? (item.primaryValue / item.netWgt) : 0
            }))
          });
        } catch (error) {
          console.error(`❌ Exception fetching data for ${country.name}:`, error);
          allCountryData.push({
            countryName: country.name,
            countryCode: country.code,
            data: []
          });
        }
      }

      console.log(`📊 Total countries processed: ${allCountryData.length}`);
      console.log(`📈 Countries with data: ${allCountryData.filter(d => d.data.length > 0).length}`);

      console.log('All country data:', allCountryData);

      // Combine all data by period
      const periodMap = new Map<string, any>();
      
      allCountryData.forEach(countryData => {
        console.log(`📊 Processing ${countryData.countryName}: ${countryData.data.length} records`);
        if (countryData.data.length > 0) {
          console.log(`  Sample data for ${countryData.countryName}:`, countryData.data.slice(0, 2));
          countryData.data.forEach((item: any) => {
            if (!periodMap.has(item.period)) {
              periodMap.set(item.period, { period: item.period });
            }
            const periodData = periodMap.get(item.period);
            // Log removed to avoid thousands of console logs with large datasets
            periodData[countryData.countryName] = item.unitPrice;
          });
          console.log(`  ✓ Added ${countryData.countryName} data to ${countryData.data.length} periods`);
        } else {
          console.log(`  ⚠️ No data for ${countryData.countryName}`);
        }
      });

      const chartData = Array.from(periodMap.values()).sort((a, b) => 
        a.period.localeCompare(b.period)
      );

      console.log('📈 Final chart data (first 3 periods):', JSON.stringify(chartData.slice(0, 3), null, 2));
      console.log('📈 Chart data length:', chartData.length);
      if (chartData.length > 0) {
        console.log('📈 Chart data keys (all columns):', Object.keys(chartData[0]));
        console.log('📈 Country columns in chart:', Object.keys(chartData[0]).filter(k => k !== 'period'));
        console.log('📈 Sample data from first period:', chartData[0]);
        
        // Show which periods each country has data for
        const countryPeriods: Record<string, string[]> = {};
        chartData.forEach((periodData: any) => {
          Object.keys(periodData).forEach(key => {
            if (key !== 'period') {
              if (!countryPeriods[key]) {
                countryPeriods[key] = [];
              }
              if (periodData[key] !== undefined && periodData[key] !== null) {
                countryPeriods[key].push(periodData.period);
              }
            }
          });
        });
        
        console.log('📊 Períodos por país:');
        Object.keys(countryPeriods).forEach(country => {
          console.log(`  ${country}: ${countryPeriods[country].join(', ')} (${countryPeriods[country].length} períodos)`);
        });
      }

      setPriceChartData(chartData);
      
      const countriesWithData = allCountryData.filter(d => d.data.length > 0);
      
      // Check for countries with limited data
      const countriesWithLimitedData = allCountryData
        .filter(d => d.data.length > 0 && d.data.length < 5)
        .map(d => `${d.countryName} (${d.data.length} registro${d.data.length === 1 ? '' : 's'})`);
      
      if (countriesWithLimitedData.length > 0) {
        toast({
          title: 'Advertencia: Datos limitados',
          description: `Los siguientes países tienen pocos datos: ${countriesWithLimitedData.join(', ')}. Las líneas pueden ser muy cortas en la gráfica.`,
          duration: 8000,
        });
      }
      
      toast({
        title: 'Gráfica generada',
        description: `Se cargaron datos de ${countriesWithData.length} país(es): ${countriesWithData.map(c => c.countryName).join(', ')}`,
      });
    } catch (error) {
      console.error('Error plotting prices:', error);
      toast({
        title: 'Error',
        description: 'Error al generar la gráfica de precios',
        variant: 'destructive',
      });
    } finally {
      setLoadingPriceChart(false);
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

            <div className="col-span-full">
              {filters.freq === 'A' ? (
                // Annual frequency: Year selectors
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="yearStart">{t('Inicio Periodo') || 'Period Start'}</Label>
                    <Input
                      id="yearStart"
                      type="number"
                      min="1900"
                      max="2100"
                      value={filters.yearStart}
                      onChange={(e) => setFilters({ ...filters, yearStart: parseInt(e.target.value) || 2022 })}
                      placeholder="2022"
                    />
                  </div>

                  <div>
                    <Label htmlFor="yearEnd">{t('Fin Periodo') || 'Period End'}</Label>
                    <Input
                      id="yearEnd"
                      type="number"
                      min="1900"
                      max="2100"
                      value={filters.yearEnd}
                      onChange={(e) => setFilters({ ...filters, yearEnd: parseInt(e.target.value) || 2022 })}
                      placeholder="2022"
                    />
                  </div>
                </div>
              ) : (
                // Monthly frequency: Month and Year selectors
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('Inicio Periodo') || 'Period Start'}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={filters.periodStart.getMonth().toString()}
                        onValueChange={(value) => {
                          const newDate = new Date(filters.periodStart);
                          newDate.setMonth(parseInt(value));
                          setFilters({ ...filters, periodStart: newDate });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Enero</SelectItem>
                          <SelectItem value="1">Febrero</SelectItem>
                          <SelectItem value="2">Marzo</SelectItem>
                          <SelectItem value="3">Abril</SelectItem>
                          <SelectItem value="4">Mayo</SelectItem>
                          <SelectItem value="5">Junio</SelectItem>
                          <SelectItem value="6">Julio</SelectItem>
                          <SelectItem value="7">Agosto</SelectItem>
                          <SelectItem value="8">Septiembre</SelectItem>
                          <SelectItem value="9">Octubre</SelectItem>
                          <SelectItem value="10">Noviembre</SelectItem>
                          <SelectItem value="11">Diciembre</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={filters.periodStart.getFullYear().toString()}
                        onValueChange={(value) => {
                          const newDate = new Date(filters.periodStart);
                          newDate.setFullYear(parseInt(value));
                          setFilters({ ...filters, periodStart: newDate });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => 2000 + i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('Fin Periodo') || 'Period End'}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={filters.periodEnd.getMonth().toString()}
                        onValueChange={(value) => {
                          const newDate = new Date(filters.periodEnd);
                          newDate.setMonth(parseInt(value));
                          setFilters({ ...filters, periodEnd: newDate });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Enero</SelectItem>
                          <SelectItem value="1">Febrero</SelectItem>
                          <SelectItem value="2">Marzo</SelectItem>
                          <SelectItem value="3">Abril</SelectItem>
                          <SelectItem value="4">Mayo</SelectItem>
                          <SelectItem value="5">Junio</SelectItem>
                          <SelectItem value="6">Julio</SelectItem>
                          <SelectItem value="7">Agosto</SelectItem>
                          <SelectItem value="8">Septiembre</SelectItem>
                          <SelectItem value="9">Octubre</SelectItem>
                          <SelectItem value="10">Noviembre</SelectItem>
                          <SelectItem value="11">Diciembre</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={filters.periodEnd.getFullYear().toString()}
                        onValueChange={(value) => {
                          const newDate = new Date(filters.periodEnd);
                          newDate.setFullYear(parseInt(value));
                          setFilters({ ...filters, periodEnd: newDate });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => 2000 + i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
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
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportExcel} disabled={chartData.length === 0} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </Card>

        {/* Search Results Section */}
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
                      <th className="text-left p-2 px-4 font-semibold">Reporting Country</th>
                      <th className="text-left p-2 px-6 font-semibold">Flow</th>
                      <th className="text-left p-2 px-4 font-semibold">Partner Country</th>
                      <th className="text-right p-2 font-semibold">Value (USD)</th>
                      <th className="text-right p-2 font-semibold">Quantity</th>
                      <th className="text-left p-2 font-semibold">Unit</th>
                      <th className="text-right p-2 font-semibold">Precio Unitario (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.slice(0, 10).map((row: any, idx: number) => {
                      const unitPrice = row.quantity > 0 ? (row.value / row.quantity).toFixed(2) : 'N/A';
                      return (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="p-2">{row.year}</td>
                          <td className="p-2">{row.month || '-'}</td>
                          <td className="p-2 text-sm">{row.commodity}</td>
                          <td className="p-2 px-4">{row.reporter}</td>
                          <td className="p-2 px-6">{row.flow}</td>
                          <td className="p-2 px-4">{row.partner}</td>
                          <td className="p-2 text-right font-mono">{row.value.toLocaleString()}</td>
                          <td className="p-2 text-right font-mono">{row.quantity.toLocaleString()}</td>
                          <td className="p-2 text-left">{row.qtyUnit}</td>
                          <td className="p-2 text-right font-mono">{unitPrice}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {chartData.length > 10 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing 10 of {chartData.length} records
                  </p>
                )}
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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

        {/* Forecast Section */}
        <Card className="p-6 mb-8 shadow-ocean border-2 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-primary fill-primary" />
              Pronóstico de precios (Premium)
            </h2>
            <span className="text-xs text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
              Solo usuarios premium
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="forecast-reporter">País reportero</Label>
              <Select 
                value={String(forecastInputs.reporterCode)} 
                onValueChange={(value) => setForecastInputs({ ...forecastInputs, reporterCode: value })}
                disabled={loadingCatalogs}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCatalogs ? "Cargando..." : "Seleccionar país"} />
                </SelectTrigger>
                <SelectContent className="bg-background z-[100] max-h-[300px]">
                  {reporters.map((country) => (
                    <SelectItem key={country.id} value={String(country.id)}>
                      {country.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="forecast-partner">País socio</Label>
              <Select 
                value={String(forecastInputs.partnerCode)} 
                onValueChange={(value) => setForecastInputs({ ...forecastInputs, partnerCode: value })}
                disabled={loadingCatalogs}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCatalogs ? "Cargando..." : "Seleccionar socio"} />
                </SelectTrigger>
                <SelectContent className="bg-background z-[100] max-h-[300px]">
                  {partners.map((country) => (
                    <SelectItem key={country.id} value={String(country.id)}>
                      {country.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="forecast-hsCode">Código HS</Label>
              <Select 
                value={forecastInputs.cmdCode} 
                onValueChange={(value) => setForecastInputs({ ...forecastInputs, cmdCode: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar código HS" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50 max-h-[300px]">
                  {seafoodHSCodes.map((code) => (
                    <SelectItem key={code.id} value={code.id}>
                      {code.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="base-variable">Variable base</Label>
              <Input
                id="base-variable"
                type="text"
                value="Precio unitario (USD) - País reportero"
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="forecast-flow">Flujo</Label>
              <Select 
                value={forecastInputs.flowCode} 
                onValueChange={(value) => setForecastInputs({ ...forecastInputs, flowCode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="1">Export</SelectItem>
                  <SelectItem value="2">Import</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="forecast-freq">Frecuencia</Label>
              <Select 
                value={forecastInputs.freq} 
                onValueChange={(value) => setForecastInputs({ ...forecastInputs, freq: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="A">Annual</SelectItem>
                  <SelectItem value="M">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-full">
              {forecastInputs.freq === 'A' ? (
                // Annual frequency: Year selectors
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="forecast-yearStart">Inicio Periodo</Label>
                    <Input
                      id="forecast-yearStart"
                      type="number"
                      min="1900"
                      max="2100"
                      value={forecastInputs.yearStart}
                      onChange={(e) => setForecastInputs({ ...forecastInputs, yearStart: parseInt(e.target.value) || 2022 })}
                      placeholder="2022"
                    />
                  </div>

                  <div>
                    <Label htmlFor="forecast-yearEnd">Fin Periodo</Label>
                    <Input
                      id="forecast-yearEnd"
                      type="number"
                      min="1900"
                      max="2100"
                      value={forecastInputs.yearEnd}
                      onChange={(e) => setForecastInputs({ ...forecastInputs, yearEnd: parseInt(e.target.value) || 2022 })}
                      placeholder="2022"
                    />
                  </div>
                </div>
              ) : (
                // Monthly frequency: Month + Year selectors
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Inicio Periodo</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={forecastInputs.periodStart.getMonth().toString()}
                        onValueChange={(value) => {
                          const newDate = new Date(forecastInputs.periodStart);
                          newDate.setMonth(parseInt(value));
                          setForecastInputs({ ...forecastInputs, periodStart: newDate });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="0">Enero</SelectItem>
                          <SelectItem value="1">Febrero</SelectItem>
                          <SelectItem value="2">Marzo</SelectItem>
                          <SelectItem value="3">Abril</SelectItem>
                          <SelectItem value="4">Mayo</SelectItem>
                          <SelectItem value="5">Junio</SelectItem>
                          <SelectItem value="6">Julio</SelectItem>
                          <SelectItem value="7">Agosto</SelectItem>
                          <SelectItem value="8">Septiembre</SelectItem>
                          <SelectItem value="9">Octubre</SelectItem>
                          <SelectItem value="10">Noviembre</SelectItem>
                          <SelectItem value="11">Diciembre</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={forecastInputs.periodStart.getFullYear().toString()}
                        onValueChange={(value) => {
                          const newDate = new Date(forecastInputs.periodStart);
                          newDate.setFullYear(parseInt(value));
                          setForecastInputs({ ...forecastInputs, periodStart: newDate });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {Array.from({ length: 31 }, (_, i) => 2000 + i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Fin Periodo</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={forecastInputs.periodEnd.getMonth().toString()}
                        onValueChange={(value) => {
                          const newDate = new Date(forecastInputs.periodEnd);
                          newDate.setMonth(parseInt(value));
                          setForecastInputs({ ...forecastInputs, periodEnd: newDate });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="0">Enero</SelectItem>
                          <SelectItem value="1">Febrero</SelectItem>
                          <SelectItem value="2">Marzo</SelectItem>
                          <SelectItem value="3">Abril</SelectItem>
                          <SelectItem value="4">Mayo</SelectItem>
                          <SelectItem value="5">Junio</SelectItem>
                          <SelectItem value="6">Julio</SelectItem>
                          <SelectItem value="7">Agosto</SelectItem>
                          <SelectItem value="8">Septiembre</SelectItem>
                          <SelectItem value="9">Octubre</SelectItem>
                          <SelectItem value="10">Noviembre</SelectItem>
                          <SelectItem value="11">Diciembre</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={forecastInputs.periodEnd.getFullYear().toString()}
                        onValueChange={(value) => {
                          const newDate = new Date(forecastInputs.periodEnd);
                          newDate.setFullYear(parseInt(value));
                          setForecastInputs({ ...forecastInputs, periodEnd: newDate });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {Array.from({ length: 31 }, (_, i) => 2000 + i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-full">
              <Label className="mb-2 block">Variables exógenas (Países con flujo al país socio)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { index: 0, label: 'Primer país' },
                  { index: 1, label: 'Segundo país' },
                  { index: 2, label: 'Tercer país' },
                  { index: 3, label: 'Cuarto país' }
                ].map(({ index, label }) => (
                  <div key={index}>
                    <Label className="text-xs text-muted-foreground mb-1">{label}</Label>
                    <Select 
                      value={forecastInputs.additionalCountries[index]} 
                      onValueChange={(value) => handleAdditionalCountryChange(index, value)}
                      disabled={loadingCatalogs}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="none">Ninguno</SelectItem>
                        {reporters.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ejemplo: usar precios de México, EE.UU., Japón y Noruega para predecir Australia → China
              </p>
            </div>

            <div className="col-span-full">
              <Label className="mb-2 block">Selector de horizonte</Label>
              <Select 
                value={forecastInputs.horizon} 
                onValueChange={(value) => setForecastInputs({ ...forecastInputs, horizon: value })}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Seleccionar horizonte" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="3">3 meses</SelectItem>
                  <SelectItem value="6">6 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={handlePlotPrices} 
              disabled={loadingPriceChart || loadingForecast} 
              className="gap-2"
              variant="outline"
            >
              <TrendingUp className="h-4 w-4" />
              {loadingPriceChart ? 'Cargando gráfica...' : 'Graficar Precios'}
            </Button>
            
            <Button 
              onClick={handleGeneratePriceForecast} 
              disabled={loadingForecast || loadingPriceChart} 
              className="gap-2"
            >
              {loadingForecast ? 'Generando pronóstico...' : 'Generar Pronóstico 📈'}
            </Button>
          </div>

          {priceChartData.length > 0 && (
            <div className="mt-6 space-y-6">
              {/* Summary table showing data availability */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Resumen de Datos Disponibles</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">País</th>
                        <th className="text-right p-2 font-semibold">Períodos con Datos</th>
                        <th className="text-left p-2 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(priceChartData[0])
                        .filter(key => key !== 'period')
                        .map((countryName) => {
                          const periods = priceChartData
                            .filter((d: any) => d[countryName] !== undefined && d[countryName] !== null && d[countryName] > 0)
                            .map((d: any) => d.period);
                          const hasData = periods.length > 0;
                          return (
                            <tr key={countryName} className={`border-b hover:bg-muted/50 ${!hasData ? 'bg-destructive/10' : ''}`}>
                              <td className="p-2 font-medium">{countryName}</td>
                              <td className="text-right p-2">{periods.length}</td>
                              <td className="p-2">
                                {hasData ? (
                                  <span className="text-green-600 dark:text-green-400 text-xs">✓ Datos disponibles</span>
                                ) : (
                                  <span className="text-destructive text-xs">✗ Sin datos</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Si un país no aparece en la tabla, significa que no tiene datos comerciales registrados para el período seleccionado.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Precios Unitarios por País</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={priceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis label={{ value: 'Precio Unitario (USD/kg)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    {priceChartData.length > 0 && Object.keys(priceChartData[0])
                      .filter(key => key !== 'period')
                      .map((countryName, index) => {
                        const colors = ['hsl(var(--primary))', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a855f7', '#f97316'];
                        return (
                          <Line 
                            key={countryName}
                            type="monotone" 
                            dataKey={countryName} 
                            stroke={colors[index % colors.length]} 
                            strokeWidth={3}
                            name={countryName}
                            connectNulls={false}
                            dot={{ r: 8, strokeWidth: 2, fill: colors[index % colors.length] }}
                            activeDot={{ r: 10 }}
                          />
                        );
                      })}
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-2">
                  Nota: Los puntos individuales representan datos disponibles. Algunos países pueden tener datos limitados para ciertos períodos.
                </p>
              </div>
            </div>
          )}

          {priceForecastData.length > 0 && (
            <div className="mt-6 space-y-6 border-t pt-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  📈 Pronóstico de Precios Unitarios
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={priceForecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      label={{ value: 'Horizonte (Meses/Periodos Futuros)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Precio Pronosticado (USD)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Pronóstico']}
                      labelFormatter={(label) => `Periodo: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="forecast" 
                      stroke="#f97316" 
                      strokeWidth={3}
                      name="Pronóstico (USD)"
                      dot={{ r: 6, fill: '#f97316' }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-2 italic text-center">
                  Pronóstico generado con modelo NARX – Sección Premium
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Valores Pronosticados</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold">Mes</th>
                        <th className="text-right p-3 font-semibold">Precio Pronosticado (USD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceForecastData.map((row, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{row.period}</td>
                          <td className="p-3 text-right font-mono text-primary font-bold">${row.forecast.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-2 italic text-center">
                  Pronóstico generado con modelo NARX – Sección Premium
                </p>
              </div>
            </div>
          )}

          {forecastData.length > 0 && (
            <div className="mt-6 space-y-6 border-t pt-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Gráfico de Pronóstico NARX</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="forecast" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Pronóstico"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Pronóstico generado con modelo NARX
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Valores Pronosticados NARX</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Periodo</th>
                        <th className="text-left p-2 font-semibold">Valor Pronosticado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecastData.map((row, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-2">{row.month}</td>
                          <td className="p-2">{row.forecast.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};

export default Explorer;
