import * as React from "react"
import { cn } from "../../lib/utils"

const Avatar = React.forwardRef(({ className, style, children, ...props }, ref) => (
  <div
    ref={ref}
    style={style}
    className={cn(
      "relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full font-medium text-[12px] text-white items-center justify-center",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
Avatar.displayName = "Avatar"

export { Avatar }
