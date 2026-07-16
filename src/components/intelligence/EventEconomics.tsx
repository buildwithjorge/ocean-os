import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useAppContext } from "../../app/AppContext";

const colors = ["#30C7F2", "#54D68A", "#F4B744", "#FF625F"];

export function EventEconomics() {
  const { economics } = useAppContext();
  const total = economics.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="econ-wrap">
      <div className="econ-title-row">
        <h4>Event Economics</h4>
        <strong>${total.toLocaleString()}</strong>
      </div>
      <div className="econ-chart">
        <ResponsiveContainer width="100%" height={170}>
          <PieChart>
            <Pie data={economics} dataKey="value" nameKey="name" innerRadius={44} outerRadius={70} paddingAngle={3}>
              {economics.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${Number(value ?? 0).toLocaleString()}`} />
            <Legend verticalAlign="bottom" iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
