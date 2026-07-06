import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Trophy,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Info,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
} from "recharts";
import {
  loadState,
  saveState,
  todayISO,
  toISO,
  fromISO,
  daysBetween,
  computeStreaks,
  isMilestone,
  nextMilestone,
  MILESTONES,
  type AppState,
  type Relapse,
  type Trigger,
  type Mood,
} from "@/lib/tracker-storage";

export const Route = createFileRoute("/")({
  component: App,
});

const DRY_LINES = [
  "Mais um dia sem bater uma.",
  "O controle segue firme.",
  "Sem drama, só consistência.",
  "Você está segurando a linha.",
  "A vontade passou, e você venceu.",
  "Mais uma vitória sem ceder.",
  "O corpo aprende, e você acompanha.",
  "Sem julgamento, só registro.",
];

function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [tab, setTab] = useState("hoje");
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);

    if (typeof window !== "undefined") {
      const seen = window.localStorage.getItem("sa-e-nata:welcome-seen:v1");
      if (!seen) {
        setWelcomeOpen(true);
      }
    }
  }, []);

  const update = (s: AppState) => {
    setState(s);
    saveState(s);
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-lg px-6 pt-24">
          <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
          <div className="mt-16 h-56 w-56 mx-auto animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    );
  }

  const closeWelcome = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sa-e-nata:welcome-seen:v1", "1");
    }
    setWelcomeOpen(false);
  };

  return (
    <Dialog open={welcomeOpen} onOpenChange={(open) => !open && closeWelcome()}>
      <TooltipProvider delayDuration={200}>
        <div className="min-h-screen bg-background">
          <div className="mx-auto flex min-h-screen max-w-lg flex-col px-5 pb-10 pt-8 sm:px-6 sm:pt-12">
            <Header />

            <Tabs
              value={tab}
              onValueChange={setTab}
              className="mt-8 flex flex-1 flex-col"
            >
              <TabsList className="grid h-11 w-full grid-cols-4 rounded-lg bg-surface p-1">
                <TabTrigger value="hoje">Hoje</TabTrigger>
                <TabTrigger value="calendario">Calendário</TabTrigger>
                <TabTrigger value="historico">Histórico</TabTrigger>
                <TabTrigger value="stats">Stats</TabTrigger>
              </TabsList>

              <div className="relative mt-8 flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {tab === "hoje" && <TodayView state={state} update={update} />}
                    {tab === "calendario" && <CalendarView state={state} />}
                    {tab === "historico" && (
                      <HistoryView state={state} update={update} />
                    )}
                    {tab === "stats" && <StatsView state={state} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </Tabs>
          </div>
        </div>
      </TooltipProvider>

      <DialogContent className="max-w-md rounded-lg border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            Bem-vindo ao Pungos App, Sá e Nata
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Aqui você conta os dias sem bater uma e acompanha seu progresso com
            calma, sem julgamento e sem confete.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 rounded-lg border border-border bg-surface p-3 text-sm text-foreground">
          Hoje é mais um dia para mostrar que você consegue segurar a linha.
        </div>
        <DialogFooter className="mt-2">
          <Button onClick={closeWelcome} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Entrar no app
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TabTrigger({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <TabsTrigger
      value={value}
      className="rounded-md text-xs font-medium text-muted-foreground transition-colors data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-none sm:text-sm"
    >
      {children}
    </TabsTrigger>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <span className="font-mono text-[13px] tracking-tight text-foreground">
          sá &amp; nata
        </span>
      </div>
      <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        v1.0
      </span>
    </div>
  );
}

/* --------------------------------- HOJE ---------------------------------- */

function useCountUp(target: number, duration = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

function TodayView({
  state,
  update,
}: {
  state: AppState;
  update: (s: AppState) => void;
}) {
  const days = daysBetween(state.startDate, todayISO());
  const displayDays = useCountUp(days);
  const nextM = nextMilestone(days);
  const prevM = MILESTONES.filter((m) => m <= days).pop() ?? 0;
  const progress = Math.min(1, (days - prevM) / (nextM - prevM || 1));
  const milestoneHit = isMilestone(days) && days > 0;

  const line = useMemo(
    () => DRY_LINES[Math.abs(days) % DRY_LINES.length],
    [days],
  );

  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [trigger, setTrigger] = useState<Trigger | "">("");
  const [mood, setMood] = useState<Mood | "">("");

  const registerRelapse = () => {
    const today = todayISO();
    const r: Relapse = {
      id: crypto.randomUUID(),
      date: today,
      note: note.trim() || undefined,
      trigger: (trigger || undefined) as Trigger | undefined,
      mood: (mood || undefined) as Mood | undefined,
    };
    const next = new Date();
    next.setDate(next.getDate() + 1);
    update({
      ...state,
      relapses: [...state.relapses, r],
      startDate: toISO(next),
    });
    setOpen(false);
    setNote("");
    setTrigger("");
    setMood("");
    toast("Registrado. Contador zerado.");
  };

  return (
    <div className="flex flex-col items-center">
      {/* Ring + counter */}
      <div className="relative mt-2 flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
        <ProgressRing progress={progress} milestone={milestoneHit} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-mono text-[86px] font-light leading-none tracking-tight text-foreground tabular-nums sm:text-[104px]">
            {displayDays}
          </div>
          <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {days === 1 ? "dia" : "dias"}
          </div>
        </div>
      </div>

      {/* Copy */}
      <p className="mt-8 max-w-xs text-center text-[15px] leading-relaxed text-foreground">
        Dia {days}. {line} Você já está em {days} dias sem bater uma.
      </p>

      {/* Milestone card */}
      {milestoneHit && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="mt-6 flex items-center gap-3 rounded-lg border border-border bg-primary-muted px-4 py-3"
        >
          <Trophy className="h-4 w-4 text-primary" strokeWidth={1.75} />
          <div className="text-sm">
            <span className="font-medium text-foreground">Marco de {days} dias sem bater uma.</span>{" "}
            <span className="text-muted-foreground">Anotado.</span>
          </div>
        </motion.div>
      )}

      {/* Next milestone hint */}
      <div className="mt-8 flex w-full items-center justify-between border-t border-border pt-5 text-xs text-muted-foreground">
        <span>Próximo marco</span>
        <span className="font-mono tabular-nums text-foreground">
          {nextM - days} {nextM - days === 1 ? "dia" : "dias"} · {nextM}d
        </span>
      </div>

      {/* Relapse button */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="mt-8 h-11 w-full border-border text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground"
          >
            Registrar recaída
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md rounded-lg border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              Zerar o contador
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Isso reinicia sua contagem a partir de amanhã. Sem julgamento — só
              dados.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trigger" className="text-xs font-medium text-muted-foreground">
                Gatilho (opcional)
              </Label>
              <Select value={trigger || undefined} onValueChange={(v) => setTrigger(v as Trigger)}>
                <SelectTrigger id="trigger" className="h-10">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tedio">Tédio</SelectItem>
                  <SelectItem value="estresse">Estresse</SelectItem>
                  <SelectItem value="solidao">Solidão</SelectItem>
                  <SelectItem value="algoritmo">Algoritmo</SelectItem>
                  <SelectItem value="sono">Insônia</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood" className="text-xs font-medium text-muted-foreground">
                Humor (opcional)
              </Label>
              <Select value={mood || undefined} onValueChange={(v) => setMood(v as Mood)}>
                <SelectTrigger id="mood" className="h-10">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="otimo">Ótimo</SelectItem>
                  <SelectItem value="bem">Bem</SelectItem>
                  <SelectItem value="neutro">Neutro</SelectItem>
                  <SelectItem value="mal">Mal</SelectItem>
                  <SelectItem value="pessimo">Péssimo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note" className="text-xs font-medium text-muted-foreground">
                Nota (opcional)
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="O que aconteceu?"
                className="min-h-[72px] resize-none text-sm"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button
              onClick={registerRelapse}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProgressRing({
  progress,
  milestone,
}: {
  progress: number;
  milestone: boolean;
}) {
  const size = 288;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - progress);
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={stroke}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={milestone ? stroke + 0.5 : stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/* ------------------------------ CALENDÁRIO ------------------------------- */

function CalendarView({ state }: { state: AppState }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [direction, setDirection] = useState(0);

  const move = (delta: number) => {
    setDirection(delta);
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + delta);
    setCursor(d);
  };

  const relapseSet = useMemo(
    () => new Set(state.relapses.map((r) => r.date)),
    [state.relapses],
  );
  const relapseMap = useMemo(() => {
    const m = new Map<string, Relapse>();
    state.relapses.forEach((r) => m.set(r.date, r));
    return m;
  }, [state.relapses]);

  const cleanSet = useMemo(() => {
    const { history, currentDays, currentStart } = computeStreaks(state);
    const set = new Set<string>();
    history.forEach((s) => {
      const start = fromISO(s.start);
      for (let i = 0; i < s.days; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        set.add(toISO(d));
      }
    });
    const s = fromISO(currentStart);
    for (let i = 0; i <= currentDays; i++) {
      const d = new Date(s);
      d.setDate(s.getDate() + i);
      set.add(toISO(d));
    }
    return set;
  }, [state]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (first.getDay() + 6) % 7; // Mon-first

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = cursor.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const todayStr = todayISO();

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => move(-1)}
          aria-label="Mês anterior"
          className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <div className="text-sm font-medium capitalize tracking-tight">
          {monthLabel}
        </div>
        <button
          onClick={() => move(1)}
          aria-label="Próximo mês"
          className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
          <div key={d} className="pb-2">
            {d}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={cursor.toISOString()}
          initial={{ opacity: 0, x: direction * 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -20 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-7 gap-1"
        >
          {cells.map((d, i) => {
            if (!d) return <div key={i} className="aspect-square" />;
            const iso = toISO(d);
            const isFuture = iso > todayStr;
            const isRelapse = relapseSet.has(iso);
            const isClean = cleanSet.has(iso) && !isRelapse;
            const isToday = iso === todayStr;
            const rel = relapseMap.get(iso);

            const cell = (
              <div
                className={`relative aspect-square flex flex-col items-center justify-center rounded-md text-[11px] transition-colors ${
                  isToday
                    ? "ring-1 ring-inset ring-foreground/20"
                    : "hover:bg-surface"
                } ${isFuture ? "text-muted-foreground/40" : "text-foreground"}`}
              >
                <span className="font-mono tabular-nums">{d.getDate()}</span>
                <div className="mt-0.5 h-1.5 w-1.5">
                  {isClean && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                  {isRelapse && (
                    <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  )}
                </div>
              </div>
            );

            if (isRelapse) {
              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <div>{cell}</div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="rounded-md border border-border bg-background text-xs text-foreground shadow-sm"
                  >
                    <div className="font-medium">Recaída</div>
                    {rel?.trigger && (
                      <div className="text-muted-foreground">
                        Gatilho: {rel.trigger}
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return <div key={i}>{cell}</div>;
          })}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-center gap-6 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Limpo
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-foreground" /> Recaída
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- HISTÓRICO ------------------------------ */

function HistoryView({
  state,
  update,
}: {
  state: AppState;
  update: (s: AppState) => void;
}) {
  const { history } = computeStreaks(state);
  const items = [...state.relapses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((r, idx, arr) => {
      const totalIdx = state.relapses.length - 1 - idx;
      const streakDays = history[totalIdx]?.days ?? 0;
      return { relapse: r, streakDays };
    });

  const [editing, setEditing] = useState<Relapse | null>(null);
  const [note, setNote] = useState("");

  const remove = (id: string) => {
    update({ ...state, relapses: state.relapses.filter((r) => r.id !== id) });
    toast("Removido.");
  };

  const openEdit = (r: Relapse) => {
    setEditing(r);
    setNote(r.note ?? "");
  };
  const saveEdit = () => {
    if (!editing) return;
    update({
      ...state,
      relapses: state.relapses.map((r) =>
        r.id === editing.id ? { ...r, note: note.trim() || undefined } : r,
      ),
    });
    setEditing(null);
    toast("Atualizado.");
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center pt-10 text-center">
        <Info className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
        <p className="mt-3 text-sm text-foreground">Nada por aqui ainda.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Recaídas aparecem nesta linha do tempo.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        {items.length} {items.length === 1 ? "registro" : "registros"}
      </div>
      <ul className="mt-4 divide-y divide-border">
        {items.map((it, i) => (
          <motion.li
            key={it.relapse.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className="group flex items-start justify-between py-4"
          >
            <div className="min-w-0 flex-1 pr-3">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm tabular-nums text-foreground">
                  {formatDate(it.relapse.date)}
                </span>
                <span className="text-xs text-muted-foreground">
                  streak: {it.streakDays}d
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {it.relapse.trigger && <span>#{it.relapse.trigger}</span>}
                {it.relapse.mood && <span>humor: {it.relapse.mood}</span>}
              </div>
              {it.relapse.note && (
                <p className="mt-2 text-sm text-foreground/80">
                  {it.relapse.note}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-0">
              <button
                aria-label="Editar"
                onClick={() => openEdit(it.relapse)}
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
              <button
                aria-label="Excluir"
                onClick={() => remove(it.relapse.id)}
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </motion.li>
        ))}
      </ul>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              Editar nota
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-2 min-h-[80px] resize-none"
          />
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={saveEdit}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatDate(iso: string) {
  return fromISO(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ------------------------------- ESTATÍSTICAS ---------------------------- */

function StatsView({ state }: { state: AppState }) {
  const { history, currentDays } = computeStreaks(state);
  const allStreaks = [...history.map((h) => h.days), currentDays];
  const record = Math.max(0, ...allStreaks);
  const total = allStreaks.reduce((a, b) => a + b, 0);
  const avg = allStreaks.length
    ? Math.round(total / allStreaks.length)
    : 0;

  const chartData = history.map((h, i) => ({
    idx: i + 1,
    days: h.days,
  }));
  chartData.push({ idx: chartData.length + 1, days: currentDays });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-2">
        <Metric label="Streak atual" value={currentDays} suffix="d" />
        <Metric label="Recorde" value={record} suffix="d" />
        <Metric label="Média" value={avg} suffix="d" />
        <Metric label="Total limpo" value={total} suffix="d" />
      </div>

      {chartData.length > 1 && (
        <div>
          <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
            Streaks ao longo do tempo
          </div>
          <div className="h-40 w-full rounded-lg border border-border p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
              >
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="2 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="idx"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <RTooltip
                  cursor={{ stroke: "var(--color-border)" }}
                  contentStyle={{
                    background: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="days"
                  stroke="var(--color-primary)"
                  strokeWidth={1.5}
                  dot={{ r: 2, fill: "var(--color-primary)" }}
                  activeDot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <Heatmap state={state} />
    </div>
  );
}

function Metric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-mono text-2xl font-light tabular-nums text-foreground">
          {value}
        </span>
        {suffix && (
          <span className="text-xs text-muted-foreground">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function Heatmap({ state }: { state: AppState }) {
  const { history, currentDays, currentStart } = computeStreaks(state);
  const cleanSet = new Set<string>();
  history.forEach((s) => {
    const start = fromISO(s.start);
    for (let i = 0; i < s.days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cleanSet.add(toISO(d));
    }
  });
  const cs = fromISO(currentStart);
  for (let i = 0; i <= currentDays; i++) {
    const d = new Date(cs);
    d.setDate(cs.getDate() + i);
    cleanSet.add(toISO(d));
  }
  const relapseSet = new Set(state.relapses.map((r) => r.date));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = today;
  const start = new Date(today);
  start.setDate(start.getDate() - 26 * 7 + 1); // 26 weeks
  // Align to Monday
  const dow = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - dow);

  const cols: Date[][] = [];
  let cur = new Date(start);
  while (cur <= end) {
    const col: Date[] = [];
    for (let i = 0; i < 7; i++) {
      col.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    cols.push(col);
  }

  return (
    <div>
      <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
        Últimas 26 semanas
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-1">
          {cols.map((col, i) => (
            <div key={i} className="flex flex-col gap-1">
              {col.map((d, j) => {
                const iso = toISO(d);
                const future = d > end;
                const isRelapse = relapseSet.has(iso);
                const isClean = cleanSet.has(iso) && !isRelapse;
                let cls =
                  "h-2.5 w-2.5 rounded-[2px] bg-surface-2 border border-border/40";
                if (future) cls = "h-2.5 w-2.5 rounded-[2px] bg-transparent";
                else if (isRelapse)
                  cls = "h-2.5 w-2.5 rounded-[2px] bg-foreground";
                else if (isClean) cls = "h-2.5 w-2.5 rounded-[2px] bg-primary";
                return <div key={j} className={cls} title={iso} />;
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
