export default function Card({ children, className = "" }) {
    return (
        <div className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700 overflow-hidden transition-all duration-300 hover:border-gray-600 ${className}`}>
            {children}
        </div>
    );
}