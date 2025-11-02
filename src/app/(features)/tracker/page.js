import ProgressCardTracker from "@/components/tracker/progressCardTracker";
import DailyTasks from "@/components/tracker/taskTracker";
import Tree from "@/components/tracker/tree";

export default function Tracker() {
    return (
        <div>
            <ProgressCardTracker/>
            <DailyTasks />
            <Tree />

         
        </div>
    )
}