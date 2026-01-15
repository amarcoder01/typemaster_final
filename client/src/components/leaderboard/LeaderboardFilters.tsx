import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/searchable-select";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Globe, Code, HelpCircle, Filter, Clock } from "lucide-react";
import { 
  type LeaderboardMode,
  type LeaderboardFilter,
  getModeConfig,
} from "@/lib/leaderboard-config";

interface LeaderboardFiltersProps {
  mode: LeaderboardMode;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
}

function getFilterIcon(filterKey: string, mode: LeaderboardMode) {
  if (mode === "code" && filterKey === "language") {
    return <Code className="w-4 h-4" />;
  }
  
  switch (filterKey) {
    case "language":
      return <Globe className="w-4 h-4" />;
    case "programmingLanguage":
      return <Code className="w-4 h-4" />;
    default:
      return <Filter className="w-4 h-4" />;
  }
}

export function LeaderboardFilters({ mode, filters, onFilterChange }: LeaderboardFiltersProps) {
  const config = getModeConfig(mode);
  
  if (config.filters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap w-full">
      {config.filters.map((filter: LeaderboardFilter) => (
        <div key={filter.key} className="flex items-center gap-2 w-full sm:w-auto">
          {filter.key === "timeframe" ? (
            <SearchableSelect
              value={filters[filter.key] || filter.defaultValue || "all"}
              onValueChange={(v) => onFilterChange(filter.key, v)}
              options={filter.options}
              placeholder="Select period"
              searchPlaceholder="Search period..."
              emptyText="No period found."
              icon={<Clock className="w-4 h-4" />}
              triggerClassName="w-full sm:w-[200px]"
              contentClassName="max-h-[300px] overflow-y-auto"
              data-testid={`filter-${filter.key}-dropdown`}
            />
          ) : filter.type === "tabs" ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Tabs 
                value={filters[filter.key] || filter.defaultValue || "all"} 
                onValueChange={(v) => onFilterChange(filter.key, v)}
              >
                <TabsList className="flex h-auto sm:h-9 p-1 bg-muted/60 w-full overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-lg border border-transparent sm:border-slate-800/50 gap-0.5 pr-1 sm:pr-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x sm:snap-none">
                  {filter.options.map((option) => {
                    const isActive = (filters[filter.key] || filter.defaultValue || "all") === option.value;
                    return (
                      <TabsTrigger 
                        key={option.value}
                        value={option.value}
                        className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap flex-shrink-0 overflow-hidden snap-start rounded-md border border-transparent relative z-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-none"
                        data-testid={`filter-${filter.key}-${option.value}`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId={`active-filter-${filter.key}-tab`}
                            className="absolute inset-0 bg-background rounded-sm pointer-events-none z-0 shadow-none md:shadow-sm"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <span className="relative z-10">{option.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <SearchableSelect
                value={filters[filter.key] || filter.defaultValue || "all"}
                onValueChange={(v) => onFilterChange(filter.key, v)}
                options={filter.options}
                placeholder={`Select ${filter.label}`}
                searchPlaceholder={`Search ${filter.label.toLowerCase()}...`}
                emptyText={`No ${filter.label.toLowerCase()} found.`}
                icon={getFilterIcon(filter.key, mode)}
                triggerClassName={mode === "code" ? "w-full sm:w-[280px]" : "w-full sm:w-[180px]"}
                contentClassName="max-h-[300px] overflow-y-auto"
                data-testid={`filter-${filter.key}`}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    type="button" 
                    className="self-end sm:self-auto text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    aria-label={`${filter.label} help`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-medium">{filter.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Filter leaderboard results by {filter.label.toLowerCase()}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default LeaderboardFilters;

