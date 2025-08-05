import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { type, format = 'csv', data } = await request.json()

    if (format === 'csv') {
      return generateCSV(type, data)
    } else if (format === 'pdf') {
      return generatePDF(type, data)
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

function generateCSV(type: string, data: any) {
  let csvContent = ''
  
  if (type === 'Weekly Attendance') {
    // CSV header
    csvContent = 'Week,Total Bookings,Completed,No-Shows,Cancelled,Completion Rate\n'
    
    // Add weekly data
    data.weeklyAttendance.forEach((week: any) => {
      csvContent += `${week.week},${week.totalBookings},${week.completed},${week.noShows},${week.cancelled},${week.completionRate}%\n`
    })
    
    // Add summary
    csvContent += '\nSummary\n'
    csvContent += `Total Bookings,${data.summary.totalBookings}\n`
    csvContent += `Completed,${data.summary.completed}\n`
    csvContent += `No-Shows,${data.summary.noShows}\n`
    csvContent += `Success Rate,${data.summary.successRate}%\n`
    csvContent += `Total Samples,${data.summary.totalSamples}\n`
  } else if (type === 'Sample Analysis') {
    csvContent = 'Metric,Value\n'
    csvContent += `Total Samples,${data.summary.totalSamples}\n`
    csvContent += `Sample Completion Rate,${data.summary.completed ? Math.round((data.summary.totalSamples / data.summary.completed) * 100) : 0}%\n`
    csvContent += `Avg Samples per Session,${data.summary.completed ? Math.round(data.summary.totalSamples / data.summary.completed) : 0}\n`
  }

  const blob = new Blob([csvContent], { type: 'text/csv' })
  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${type.toLowerCase().replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
}

function generatePDF(type: string, data: any) {
  // For now, return a simple text-based PDF-like format
  // In a real implementation, you'd use a library like jsPDF or puppeteer
  
  let pdfContent = `Report: ${type}\n`
  pdfContent += `Generated: ${new Date().toLocaleDateString()}\n\n`
  
  if (type === 'Weekly Attendance') {
    pdfContent += 'Weekly Attendance Report\n'
    pdfContent += '========================\n\n'
    
    data.weeklyAttendance.forEach((week: any) => {
      pdfContent += `${week.week}:\n`
      pdfContent += `  Total Bookings: ${week.totalBookings}\n`
      pdfContent += `  Completed: ${week.completed}\n`
      pdfContent += `  No-Shows: ${week.noShows}\n`
      pdfContent += `  Cancelled: ${week.cancelled}\n`
      pdfContent += `  Completion Rate: ${week.completionRate}%\n\n`
    })
    
    pdfContent += 'Summary:\n'
    pdfContent += `Total Bookings: ${data.summary.totalBookings}\n`
    pdfContent += `Completed: ${data.summary.completed}\n`
    pdfContent += `No-Shows: ${data.summary.noShows}\n`
    pdfContent += `Success Rate: ${data.summary.successRate}%\n`
    pdfContent += `Total Samples: ${data.summary.totalSamples}\n`
  } else if (type === 'Sample Analysis') {
    pdfContent += 'Sample Analysis Report\n'
    pdfContent += '=====================\n\n'
    pdfContent += `Total Samples: ${data.summary.totalSamples}\n`
    pdfContent += `Sample Completion Rate: ${data.summary.completed ? Math.round((data.summary.totalSamples / data.summary.completed) * 100) : 0}%\n`
    pdfContent += `Avg Samples per Session: ${data.summary.completed ? Math.round(data.summary.totalSamples / data.summary.completed) : 0}\n`
  }

  const blob = new Blob([pdfContent], { type: 'text/plain' })
  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="${type.toLowerCase().replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.txt"`
    }
  })
} 