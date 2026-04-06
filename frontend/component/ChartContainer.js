export default function ChartContainer({
    title,
    children,
    className = '',
    loading = false
}) {
    return (
        <div className={`rounded-2xl  ${className}`} >
            <h2 className="text-white text-xs font-semibold text-center my-2">
                {title}
            </h2>
            {loading ? (
                <div className="h-[300px] animate-pulse bg-gray-100 rounded"></div>
            ) : (
                <div className="text-white h-full">
                    {children}
                </div>
            )}
        </ div>
    )
}