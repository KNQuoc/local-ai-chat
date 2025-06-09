import { useState, useEffect, useCallback } from 'react'
import { SIDEBAR_CONFIG, STORAGE_KEYS } from '@/constants'

export const useSidebar = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_CONFIG.DEFAULT_WIDTH)
    const [isResizing, setIsResizing] = useState(false)

    // Load sidebar width from localStorage on mount
    useEffect(() => {
        const savedSidebarWidth = localStorage.getItem(STORAGE_KEYS.SIDEBAR_WIDTH)
        if (savedSidebarWidth) {
            setSidebarWidth(parseInt(savedSidebarWidth))
        }
    }, [])

    // Handle sidebar resizing
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsResizing(true)
        e.preventDefault()
    }

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = Math.max(
                SIDEBAR_CONFIG.MIN_WIDTH,
                Math.min(SIDEBAR_CONFIG.MAX_WIDTH, e.clientX)
            )
            setSidebarWidth(newWidth)
            localStorage.setItem(STORAGE_KEYS.SIDEBAR_WIDTH, newWidth.toString())
        }
    }, [isResizing])

    const handleMouseUp = useCallback(() => {
        setIsResizing(false)
    }, [])

    // Add global mouse event listeners for resizing
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'col-resize'
            document.body.style.userSelect = 'none'
        } else {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
    }, [isResizing, handleMouseMove, handleMouseUp])

    return {
        sidebarOpen,
        setSidebarOpen,
        sidebarWidth,
        isResizing,
        handleMouseDown
    }
} 