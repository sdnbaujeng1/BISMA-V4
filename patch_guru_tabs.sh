sed -i 's/import { ArrowLeft, Heart, CheckCircle, XCircle, Clock, Gift, X } from '\''lucide-react'\'';/import { ArrowLeft, Heart, CheckCircle, XCircle, Clock, Gift, X, BarChart3, Users, Trophy } from '\''lucide-react'\'';/g' src/pages/KasihIbuGuru.tsx
sed -i '/import { useSchoolIdentity } from/a \
import { supabase } from "../lib/supabase";\
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";' src/pages/KasihIbuGuru.tsx
