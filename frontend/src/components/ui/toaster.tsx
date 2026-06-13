import {useToast} from "@/hooks/use-toast"
import {
    Toast,
    ToastClose,
    ToastDescription,
    ToastProvider,
    ToastTitle,
    ToastViewport,
} from "@/components/ui/toast"
import {AlertTriangle, CheckCircle2} from "lucide-react"

export function Toaster() {
    const {toasts} = useToast()

    return (
        <ToastProvider>
            {toasts.map(function ({id, title, description, action, variant, ...props}) {
                const destructive = variant === "destructive"
                return (
                    <Toast key={id} variant={variant} {...props}>
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${destructive ? "bg-red-50 text-red-600" : "bg-blue-50 text-primary"}`}>
                            {destructive ? <AlertTriangle className="h-4 w-4"/> : <CheckCircle2 className="h-4 w-4"/>}
                        </div>
                        <div className="grid flex-1 gap-1">
                            {title && <ToastTitle>{title}</ToastTitle>}
                            {description && (
                                <ToastDescription>{description}</ToastDescription>
                            )}
                        </div>
                        {action}
                        <ToastClose/>
                    </Toast>
                )
            })}
            <ToastViewport/>
        </ToastProvider>
    )
}
