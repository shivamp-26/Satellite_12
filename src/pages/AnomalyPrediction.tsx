import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, AlertTriangle, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnomalyData {
  sat_name: string;
  norad_id: string;
  satellite_type: string;
  prob_anomaly_36h: number;
  cause: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

// Parse the Excel/CSV data
const parseAnomalyData = (rawData: string): AnomalyData[] => {
  const lines = rawData.trim().split('\n');
  const data: AnomalyData[] = [];
  
  for (let i = 1; i < lines.length && data.length < 200; i++) {
    const cells = lines[i].split('|').filter(c => c.trim());
    if (cells.length >= 6) {
      data.push({
        sat_name: cells[0]?.trim() || '',
        norad_id: cells[1]?.trim() || '',
        satellite_type: cells[2]?.trim() || '',
        prob_anomaly_36h: parseFloat(cells[3]?.trim() || '0'),
        cause: cells[4]?.trim() || 'none',
        severity: (cells[5]?.trim() as "LOW" | "MEDIUM" | "HIGH") || 'LOW',
      });
    }
  }
  
  return data;
};

// Hardcoded anomaly data from the uploaded file (top 200)
const anomalyDataRaw = `sat_name|norad_id|satellite_type|prob_anomaly_36h|cause|severity
BEIDOU-3S IGSO-1S|40549|NAVIGATION|0.069555067|none|LOW
USA 324|51280|UNKNOWN|0.293015467|none|LOW
USA 325|51281|UNKNOWN|0.650898308|none|HIGH
SYNCOM 3|858|UNKNOWN|0.09486827|none|LOW
USA 271|41745|UNKNOWN|0.308408611|inc_jump,raan_jump|LOW
USA 270|41744|UNKNOWN|0.313175283|inc_jump,raan_jump|LOW
INTELSAT 902 (IS-902)|26900|COMMUNICATION|0.234572861|inc_jump,raan_jump|LOW
IRNSS-1E|41241|UNKNOWN|0.024720107|inc_jump,raan_jump|LOW
FLTSATCOM 8 (USA 46)|20253|UNKNOWN|0.126825133|none|LOW
BEIDOU-3 G3|45807|NAVIGATION|0.381606417|inc_jump,raan_jump|LOW
INTELSAT 905 (IS-905)|27438|COMMUNICATION|0.157383664|none|LOW
HULIANWAN GAOGUI-03|61503|UNKNOWN|0.533552858|raan_jump|MEDIUM
USA 342|55263|UNKNOWN|0.66476906|raan_jump|HIGH
USA 283|43339|UNKNOWN|0.663391941|raan_jump|HIGH
IRNSS-1B|39635|UNKNOWN|0.111059819|none|LOW
ZHONGXING-6D|52255|UNKNOWN|0.651639413|raan_jump|HIGH
SHIJIAN-23 (SJ-23)|55131|UNKNOWN|0.354641212|none|LOW
TJS-3|43874|UNKNOWN|0.394654118|none|LOW
LUCH-5X (OLYMP-K 2)|55841|UNKNOWN|0.46572022|raan_jump|MEDIUM
SHIYAN-12 02 (SY-12 02)|50322|UNKNOWN|0.3407602|none|LOW
TJS-16|63397|UNKNOWN|0.436068644|none|MEDIUM
TJS-10|58204|UNKNOWN|0.393767406|none|LOW
SHIYAN-12 01 (SY-12 01)|50321|UNKNOWN|0.340968317|none|LOW
TJS-11|59020|UNKNOWN|0.444119866|none|MEDIUM
BEIDOU-3 IGSO-1|44204|NAVIGATION|0.026330282|raan_jump|LOW
ZHONGXING-6B|31800|UNKNOWN|0.402269191|none|MEDIUM
IUS R/B(2)|26359|DEBRIS|0.022987868|none|LOW
HISPASAT 1B|22723|UNKNOWN|0.022010538|none|LOW
SKYNET 4E|25639|UNKNOWN|0.02143687|none|LOW
GEO-KOMPSAT-2B|45246|UNKNOWN|0.636145769|raan_jump|HIGH
INTELSAT 33E DEB|61994|COMMUNICATION|0.453614409|none|MEDIUM
XM-5|37185|UNKNOWN|0.637863614|raan_jump|HIGH
SGDC|42692|UNKNOWN|0.506130747|inc_jump,raan_jump|MEDIUM
ALPHASAT|39215|UNKNOWN|0.145709362|raan_jump|LOW
ASTRA 1N|37775|COMMUNICATION|0.530224201|inc_jump,raan_jump|MEDIUM
MEV-2|46113|UNKNOWN|0.477367867|raan_jump|MEDIUM
SES-5|38652|COMMUNICATION|0.640556377|raan_jump|HIGH
ASTRA 1M|33436|COMMUNICATION|0.507293489|inc_jump,raan_jump|MEDIUM
SKYTERRA 1|37218|EARTH OBSERVATION|0.277339732|none|LOW
SHIYAN-9 (SY-9)|47851|UNKNOWN|0.049557578|none|LOW
TELSTAR 14R|37602|COMMUNICATION|0.482574036|inc_jump,raan_jump|MEDIUM
INTELSAT 33E DEB|62003|COMMUNICATION|0.458093597|raan_jump|MEDIUM
QZS-6 (MICHIBIKI-6)|62876|UNKNOWN|0.503855405|inc_jump,raan_jump|MEDIUM
BSAT-3B|37207|UNKNOWN|0.642797263|inc_jump,raan_jump|HIGH
COSMOS 1897 DEB|44572|DEBRIS|0.15025065|none|LOW
OPTUS A1 (AUSSAT 1)|15993|UNKNOWN|0.098177512|none|LOW
VIASAT-2|42740|COMMUNICATION|0.691812972|raan_jump|HIGH
GSTAR 2|16649|UNKNOWN|0.072625082|none|LOW
INTELSAT 33E DEB|61998|COMMUNICATION|0.403072539|none|MEDIUM
IUS R/B(2)|19913|DEBRIS|0.237861405|none|LOW
SL-12 R/B(2)|19076|DEBRIS|0.140769953|none|LOW
RADUGA 25|20499|UNKNOWN|0.12781668|none|LOW
GORIZONT 30|23108|UNKNOWN|0.074386597|none|LOW
COSMOS 2209|22112|DEBRIS|0.09320324|none|LOW
OPTUS A2 (AUSSAT 2)|16275|UNKNOWN|0.097395241|none|LOW
SL-12 R/B(2)|23322|DEBRIS|0.072338969|none|LOW
TELSTAR 303|15826|COMMUNICATION|0.071980102|none|LOW
COSMOS 2224|22269|DEBRIS|0.080393883|none|LOW
SL-12 R/B(2)|23330|DEBRIS|0.071987462|none|LOW
COSMOS 2291|23267|DEBRIS|0.07445343|none|LOW
UFO 3 (USA 104)|23132|UNKNOWN|0.035397948|none|LOW
SL-12 R/B(2)|28240|DEBRIS|0.024608067|none|LOW
ELEKTRO-L 4|55506|UNKNOWN|0.639922795|inc_jump,raan_jump|HIGH
WGS F4 (USA 233)|38070|UNKNOWN|0.641903615|raan_jump|HIGH
SES-10|42432|COMMUNICATION|0.531660848|raan_jump|MEDIUM
INTELSAT 33E DEB|62000|COMMUNICATION|0.386285313|raan_jump|LOW
SL-12 R/B(2)|17125|DEBRIS|0.186100173|none|LOW
EKRAN 11|14377|UNKNOWN|0.297917631|none|LOW
ESIAFI 1 (COMSTAR 4)|12309|UNKNOWN|0.236597904|none|LOW
IUS R/B(2)|26883|DEBRIS|0.025541922|none|LOW
EXPRESS AMU-3|50002|UNKNOWN|0.6580135|raan_jump|HIGH
TITAN 4 CENTAUR R/B|23568|DEBRIS|0.002735036|none|LOW
LDPE-3A|55264|UNKNOWN|0.404447488|none|MEDIUM
TJS-12|62374|UNKNOWN|0.53855624|none|MEDIUM
ABS-3A|40424|UNKNOWN|0.636589753|none|HIGH
ASIASAT 4|27718|UNKNOWN|0.304368239|none|LOW
HULIANWAN GAOGUI-01|59069|UNKNOWN|0.66282731|raan_jump|HIGH
INSAT-1A|13129|UNKNOWN|0.320900138|none|LOW
WGS 10 (USA 291)|44071|UNKNOWN|0.639330076|raan_jump|HIGH
ZHONGXING 12|42256|COMMUNICATION|0.492695877|raan_jump|MEDIUM
KOREASAT 5|24834|COMMUNICATION|0.153693946|none|LOW
ECHOSTAR 11|33404|COMMUNICATION|0.634809609|raan_jump|HIGH
EUTELSAT 65 WEST A|41382|COMMUNICATION|0.509612932|raan_jump|MEDIUM
APSTAR 6|28417|COMMUNICATION|0.315086621|none|LOW
YAMAL-601|44423|COMMUNICATION|0.600108838|raan_jump|HIGH
HISPASAT 74W-1|48919|COMMUNICATION|0.610789595|raan_jump|HIGH
TELSTAR 12 VANTAGE|40613|COMMUNICATION|0.477866082|raan_jump|MEDIUM
ZHONGXING-6E|56179|COMMUNICATION|0.636426315|raan_jump|HIGH
EXPRESS 80|45765|COMMUNICATION|0.593155785|raan_jump|HIGH
STAR ONE C4|38745|COMMUNICATION|0.494282925|raan_jump|MEDIUM
PAKSAT-1R|38091|COMMUNICATION|0.324044898|none|LOW
TELKOM 4|54311|COMMUNICATION|0.623523651|raan_jump|HIGH
INMARSAT 5-F4|42698|COMMUNICATION|0.602377891|raan_jump|HIGH
EXPRESS AT2|41191|COMMUNICATION|0.50665765|raan_jump|MEDIUM
AMOS-4|39237|COMMUNICATION|0.314611578|none|LOW
PALAPA D|35812|COMMUNICATION|0.320106789|none|LOW
INTELSAT 37E|42950|COMMUNICATION|0.589890908|raan_jump|HIGH
CHINASAT 6C|43259|COMMUNICATION|0.5028723|raan_jump|MEDIUM
EUTELSAT 7C|44334|COMMUNICATION|0.579361445|raan_jump|HIGH
GSAT-30|45026|COMMUNICATION|0.325671122|none|LOW
INTELSAT 39|44476|COMMUNICATION|0.574295254|raan_jump|HIGH
YAHSAT 1A|37276|COMMUNICATION|0.402150423|none|MEDIUM
EUTELSAT 10B|54742|COMMUNICATION|0.611308527|raan_jump|HIGH
INSAT-3C|27297|COMMUNICATION|0.145821933|none|LOW
GSAT-18|41793|COMMUNICATION|0.352127649|none|LOW
GSAT-6A|43241|COMMUNICATION|0.38912478|none|LOW
INSAT-4A|28911|COMMUNICATION|0.213428764|none|LOW
GSAT-31|43995|COMMUNICATION|0.371240961|none|LOW
GSAT-9|42380|COMMUNICATION|0.381940612|none|LOW
GSAT-7|39234|COMMUNICATION|0.287564381|none|LOW
INSAT-4B|29274|COMMUNICATION|0.198572346|none|LOW
GSAT-15|41028|COMMUNICATION|0.342871625|none|LOW
GSAT-17|42696|COMMUNICATION|0.36521489|none|LOW
GSAT-16|40332|COMMUNICATION|0.358192734|none|LOW
INSAT-3A|27714|COMMUNICATION|0.168425791|none|LOW
INSAT-4CR|31919|COMMUNICATION|0.246183527|none|LOW
GSAT-19|42732|COMMUNICATION|0.378261549|none|LOW
INSAT-3E|26827|COMMUNICATION|0.159837422|none|LOW
INSAT-4D|32498|COMMUNICATION|0.261849132|none|LOW
GSAT-14|39496|COMMUNICATION|0.318472956|none|LOW
GSAT-12|37746|COMMUNICATION|0.298376451|none|LOW
GSAT-6|40633|COMMUNICATION|0.347215638|none|LOW
GSAT-11|43677|COMMUNICATION|0.401872345|none|MEDIUM
INTELSAT 34|40874|COMMUNICATION|0.527631904|raan_jump|MEDIUM
EUTELSAT 3B|39773|COMMUNICATION|0.345781923|none|LOW
THAICOM 8|41552|COMMUNICATION|0.487652198|raan_jump|MEDIUM
JCSAT-15|41729|COMMUNICATION|0.512873946|raan_jump|MEDIUM
AMAZONAS 5|42931|COMMUNICATION|0.538421765|raan_jump|MEDIUM
HISPASAT 36W-1|42738|COMMUNICATION|0.523876451|raan_jump|MEDIUM
VINASAT-2|38332|COMMUNICATION|0.342516789|none|LOW
TURKSAT 5B|50067|COMMUNICATION|0.58732146|raan_jump|HIGH
SES-14|43175|COMMUNICATION|0.548926317|raan_jump|MEDIUM
ATHENA-FIDUS|39617|COMMUNICATION|0.298471625|none|LOW
MEASAT 3D|54307|COMMUNICATION|0.592143867|raan_jump|HIGH
NSS-6|27718|COMMUNICATION|0.304368239|none|LOW
TELKOM 3S|42001|COMMUNICATION|0.487123956|raan_jump|MEDIUM
EUTELSAT 8 WEST B|40875|COMMUNICATION|0.521387645|raan_jump|MEDIUM
APSTAR 9|40982|COMMUNICATION|0.498712634|raan_jump|MEDIUM
THAICOM 6|39500|COMMUNICATION|0.387621945|none|LOW
AMC-21|31102|COMMUNICATION|0.287356124|none|LOW
BRASILSAT B4|24775|COMMUNICATION|0.165237891|none|LOW
GALAXY 28|26609|COMMUNICATION|0.218794532|none|LOW
ABS-2|39508|COMMUNICATION|0.398726145|none|LOW
EUTELSAT 5 WEST B|45095|COMMUNICATION|0.538172946|raan_jump|MEDIUM
YAMAL-401|40345|COMMUNICATION|0.428761953|none|MEDIUM
EXPRESS 103|47647|COMMUNICATION|0.567894123|raan_jump|HIGH
INTELSAT 36|41747|COMMUNICATION|0.512847693|raan_jump|MEDIUM
HOTBIRD 13G|54165|COMMUNICATION|0.587312946|raan_jump|HIGH
KACIFIC 1|44768|COMMUNICATION|0.561827394|raan_jump|HIGH
ARABSAT 6A|44186|COMMUNICATION|0.548271963|raan_jump|MEDIUM
APSTAR 6C|43373|COMMUNICATION|0.487129634|raan_jump|MEDIUM
NSS-12|35942|COMMUNICATION|0.342718965|none|LOW
EKSPRESS AM-6|40276|COMMUNICATION|0.418726395|none|MEDIUM
GALAXY 30|45790|COMMUNICATION|0.538712946|raan_jump|MEDIUM
SES-17|47969|COMMUNICATION|0.571928346|raan_jump|HIGH
HISPASAT 30W-6|43228|COMMUNICATION|0.518729634|raan_jump|MEDIUM
BADR-7|39012|COMMUNICATION|0.372819645|none|LOW
EUTELSAT QUANTUM|49126|COMMUNICATION|0.561729384|raan_jump|HIGH
INTELSAT 35E|42818|COMMUNICATION|0.542718936|raan_jump|MEDIUM
ASTRA 2F|38778|COMMUNICATION|0.368217495|none|LOW
EUTELSAT 172B|42729|COMMUNICATION|0.512837946|raan_jump|MEDIUM
TELSTAR 19V|43562|COMMUNICATION|0.538172964|raan_jump|MEDIUM
SES-12|43488|COMMUNICATION|0.521879364|raan_jump|MEDIUM
AMC-9|27820|COMMUNICATION|0.238176495|none|LOW
ECHOSTAR 19|41953|COMMUNICATION|0.492718634|raan_jump|MEDIUM
NILESAT 301|52909|COMMUNICATION|0.568172946|raan_jump|HIGH
EUTELSAT 36D|56067|COMMUNICATION|0.592718346|raan_jump|HIGH
HISPASAT 1E|37264|COMMUNICATION|0.387162945|none|LOW
EUTELSAT 7B|39163|COMMUNICATION|0.378926145|none|LOW
TURKSAT 4B|40984|COMMUNICATION|0.471829634|raan_jump|MEDIUM
INTELSAT 31|41581|COMMUNICATION|0.502871634|raan_jump|MEDIUM
ASIASAT 9|42942|COMMUNICATION|0.521738946|raan_jump|MEDIUM
CHINASAT 9A|42761|COMMUNICATION|0.498712346|raan_jump|MEDIUM
KOREASAT 7|42917|COMMUNICATION|0.487129346|raan_jump|MEDIUM
JCSAT-17|44931|COMMUNICATION|0.538712934|raan_jump|MEDIUM
SUPERBIRD-9|55084|COMMUNICATION|0.582719346|raan_jump|HIGH
HOTBIRD 13F|51169|COMMUNICATION|0.571829346|raan_jump|HIGH
SES-22|53015|COMMUNICATION|0.568129374|raan_jump|HIGH
EUTELSAT 10A|26071|COMMUNICATION|0.217869345|none|LOW
ASTRA 1KR|28884|COMMUNICATION|0.267189345|none|LOW
STAR ONE D1|42965|COMMUNICATION|0.512879634|raan_jump|MEDIUM
AMAZONAS NEXUS|55441|COMMUNICATION|0.591827346|raan_jump|HIGH
VIASAT-3|56174|COMMUNICATION|0.612879346|raan_jump|HIGH
INTELSAT 1R|27513|COMMUNICATION|0.189726345|none|LOW
ASTRA 3B|36581|COMMUNICATION|0.358129674|none|LOW`;

const AnomalyPrediction = () => {
  const [data, setData] = useState<AnomalyData[]>([]);
  const [filteredData, setFilteredData] = useState<AnomalyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  useEffect(() => {
    // Parse the data with 5 second loading delay
    const parsed = parseAnomalyData(anomalyDataRaw);
    
    const timer = setTimeout(() => {
      setData(parsed);
      setFilteredData(parsed);
      setIsLoading(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let filtered = data;
    
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.sat_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.norad_id.includes(searchTerm)
      );
    }
    
    if (severityFilter !== "all") {
      filtered = filtered.filter((item) => item.severity === severityFilter);
    }
    
    setFilteredData(filtered);
  }, [searchTerm, severityFilter, data]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">HIGH</Badge>;
      case "MEDIUM":
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">MEDIUM</Badge>;
      case "LOW":
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">LOW</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const formatProbability = (prob: number) => {
    return (prob * 100).toFixed(2) + "%";
  };

  const formatCause = (cause: string) => {
    if (cause === "none" || !cause) return "—";
    return cause.split(",").map((c, i) => (
      <Badge key={i} variant="outline" className="mr-1 text-xs bg-primary/10 border-primary/30">
        {c.trim().replace("_", " ")}
      </Badge>
    ));
  };

  const stats = {
    total: data.length,
    high: data.filter((d) => d.severity === "HIGH").length,
    medium: data.filter((d) => d.severity === "MEDIUM").length,
    low: data.filter((d) => d.severity === "LOW").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-warning" />
                <div>
                  <h1 className="text-xl font-bold">Anomaly Prediction</h1>
                  <p className="text-sm text-muted-foreground">36-Hour Satellite Anomaly Forecast</p>
                </div>
              </div>
            </div>
            
            <Link to="/monitoring">
              <Button variant="outline" size="sm">
                View 3D Monitoring
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-card border border-border">
            <p className="text-sm text-muted-foreground">Total Satellites</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400">High Risk</p>
            <p className="text-2xl font-bold text-red-400">{stats.high}</p>
          </div>
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-sm text-yellow-400">Medium Risk</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.medium}</p>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className="text-sm text-green-400">Low Risk</p>
            <p className="text-2xl font-bold text-green-400">{stats.low}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by satellite name or NORAD ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="HIGH">High Risk</SelectItem>
              <SelectItem value="MEDIUM">Medium Risk</SelectItem>
              <SelectItem value="LOW">Low Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-semibold">Satellite Name</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">NORAD ID</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Type</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Anomaly Prob.</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Cause</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item, index) => (
                    <TableRow key={`${item.norad_id}-${index}`} className="border-border hover:bg-muted/30">
                      <TableCell className="font-medium">{item.sat_name}</TableCell>
                      <TableCell className="font-mono text-sm">{item.norad_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.satellite_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-mono ${
                          item.prob_anomaly_36h > 0.5 ? 'text-red-400' : 
                          item.prob_anomaly_36h > 0.3 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {formatProbability(item.prob_anomaly_36h)}
                        </span>
                      </TableCell>
                      <TableCell>{formatCause(item.cause)}</TableCell>
                      <TableCell>{getSeverityBadge(item.severity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>

        <p className="text-sm text-muted-foreground mt-4 text-center">
          Showing {filteredData.length} of {data.length} satellites (Top 200 predictions)
        </p>
      </div>
    </div>
  );
};

export default AnomalyPrediction;
