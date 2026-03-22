function scroll() {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
    });
}

export default function ScrollTop() {
    return <div style={{width: '100px'}} className="scroll-top h-full fixed top-0 left-0 cursor-pointer flex items-center justify-center" onClick={scroll}>
        <span className="scroll-top-text">
            Наверх
        </span>
    </div>
}