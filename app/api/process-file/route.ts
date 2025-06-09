import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const fileType = file.type.toLowerCase()
        const fileName = file.name.toLowerCase()

        let content = ''

        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            // Process PDF using pdf-parse with proper configuration
            try {
                // Import pdf-parse dynamically to avoid issues
                const pdfParse = (await import('pdf-parse')).default

                // Parse the PDF with options to handle various PDF types
                const pdfData = await pdfParse(buffer, {
                    // Disable the worker to avoid file system issues
                    max: 0, // Parse all pages
                    version: 'v1.10.100' // Use a stable version
                })

                content = pdfData.text

                // If no text was extracted, return a helpful message
                if (!content || content.trim().length === 0) {
                    return NextResponse.json({
                        error: 'No text content found in PDF. The PDF might be image-based or password-protected.'
                    }, { status: 400 })
                }

            } catch (error) {
                console.error('PDF parsing error:', error)

                // More specific error handling
                if (error instanceof Error) {
                    if (error.message.includes('ENOENT')) {
                        // Handle the test file issue by trying without options
                        try {
                            const pdfParse = (await import('pdf-parse')).default
                            const pdfData = await pdfParse(buffer)
                            content = pdfData.text
                        } catch (fallbackError) {
                            console.error('PDF fallback parsing error:', fallbackError)
                            return NextResponse.json({
                                error: 'Failed to parse PDF file. Please ensure the PDF is not password-protected or corrupted.'
                            }, { status: 500 })
                        }
                    } else {
                        return NextResponse.json({
                            error: `PDF parsing failed: ${error.message}`
                        }, { status: 500 })
                    }
                } else {
                    return NextResponse.json({
                        error: 'Failed to parse PDF file. Unknown error occurred.'
                    }, { status: 500 })
                }
            }
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
            // Process DOCX
            try {
                const mammoth = await import('mammoth')
                const result = await mammoth.extractRawText({ buffer })
                content = result.value
            } catch (error) {
                console.error('DOCX parsing error:', error)
                return NextResponse.json({ error: 'Failed to parse DOCX file' }, { status: 500 })
            }
        } else {
            return NextResponse.json({ error: 'Unsupported file type. Please upload PDF, DOCX, or text files.' }, { status: 400 })
        }

        // Basic content validation
        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'No text content found in file' }, { status: 400 })
        }

        // Clean up the content
        content = content
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/\n\s*\n/g, '\n\n') // Clean up multiple newlines
            .trim()

        // Limit content size
        const maxLength = 100000 // 100KB of text
        if (content.length > maxLength) {
            content = content.substring(0, maxLength) + '\n\n... (content truncated due to size limit)'
        }

        return NextResponse.json({
            content: content,
            originalSize: buffer.length,
            processedLength: content.length,
            pages: fileType === 'application/pdf' ? 'PDF processed successfully' : undefined
        })

    } catch (error) {
        console.error('File processing error:', error)
        return NextResponse.json({ error: 'Internal server error while processing file' }, { status: 500 })
    }
} 