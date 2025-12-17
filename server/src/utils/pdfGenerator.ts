import PDFDocument from 'pdfkit';
import { CustomerSale } from '../models/CustomerSale';
import { SupplierPurchase } from '../models/SupplierPurchase';

export interface OrderItem {
  date: Date;
  product: string;
  liters?: number;
  ratePerLitre?: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  paymentStatus: string;
}

export const generateCustomerPDF = async (
  customerName: string,
  orders: OrderItem[],
  summary: {
    totalOrders: number;
    totalAmount: number;
    totalPaid: number;
    balance: number;
  }
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('RK & Co', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).font('Helvetica').text('Customer Transaction Report', { align: 'center' });
      doc.moveDown(1);

      // Customer Information
      doc.fontSize(14).font('Helvetica-Bold').text('Customer Information');
      doc.fontSize(12).font('Helvetica').text(`Name: ${customerName}`);
      doc.moveDown(0.5);
      doc.text(`Report Generated: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`);
      doc.moveDown(1);

      // Summary Section
      doc.fontSize(14).font('Helvetica-Bold').text('Summary');
      doc.fontSize(11).font('Helvetica');
      doc.text(`Total Orders: ${summary.totalOrders}`);
      doc.text(`Total Amount: Rs ${summary.totalAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`);
      doc.text(`Total Paid: Rs ${summary.totalPaid.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`);
      doc.text(`Outstanding Balance: Rs ${summary.balance.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`);
      doc.moveDown(1);

      // Orders Table Header
      doc.fontSize(12).font('Helvetica-Bold');
      const tableTop = doc.y;
      const itemHeight = 20;
      const pageWidth = doc.page.width;
      const leftMargin = 50;
      const rightMargin = 50;
      const tableWidth = pageWidth - leftMargin - rightMargin;

      // Table headers
      doc.text('Date', leftMargin, tableTop);
      doc.text('Product', leftMargin + 80, tableTop);
      doc.text('Liters', leftMargin + 150, tableTop);
      doc.text('Rate/L', leftMargin + 210, tableTop);
      doc.text('Total', leftMargin + 270, tableTop);
      doc.text('Paid', leftMargin + 330, tableTop);
      doc.text('Balance', leftMargin + 390, tableTop);
      doc.text('Status', leftMargin + 450, tableTop);

      // Draw line under header
      doc.moveTo(leftMargin, tableTop + 15)
        .lineTo(pageWidth - rightMargin, tableTop + 15)
        .stroke();

      // Orders
      let yPosition = tableTop + 25;
      doc.fontSize(10).font('Helvetica');

      orders.forEach((order, index) => {
        // Check if we need a new page
        if (yPosition > doc.page.height - 100) {
          doc.addPage();
          yPosition = 50;
        }

        const orderDate = new Date(order.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        doc.text(orderDate, leftMargin, yPosition);
        doc.text(order.product || '-', leftMargin + 80, yPosition);
        doc.text(
          order.liters ? `${order.liters.toFixed(2)}L` : '-',
          leftMargin + 150,
          yPosition
        );
        doc.text(
          order.ratePerLitre ? `Rs ${order.ratePerLitre.toFixed(2)}` : '-',
          leftMargin + 210,
          yPosition
        );
        doc.text(
          `Rs ${order.totalAmount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          leftMargin + 270,
          yPosition
        );
        doc.text(
          `Rs ${order.paidAmount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          leftMargin + 330,
          yPosition
        );
        doc.text(
          `Rs ${order.balance.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          leftMargin + 390,
          yPosition
        );
        doc.text(order.paymentStatus.toUpperCase(), leftMargin + 450, yPosition);

        yPosition += itemHeight;

        // Draw line after each row
        if (index < orders.length - 1) {
          doc.moveTo(leftMargin, yPosition - 5)
            .lineTo(pageWidth - rightMargin, yPosition - 5)
            .stroke();
        }
      });

      // Footer
      const footerY = doc.page.height - 50;
      doc.fontSize(8).font('Helvetica').text(
        'This is a computer-generated document. For any queries, please contact RK & Co.',
        leftMargin,
        footerY,
        { align: 'center', width: tableWidth }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export const generateSupplierPDF = async (
  supplierName: string,
  orders: OrderItem[],
  summary: {
    totalOrders: number;
    totalAmount: number;
    totalPaid: number;
    balance: number;
  }
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('RK & Co', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).font('Helvetica').text('Supplier Transaction Report', { align: 'center' });
      doc.moveDown(1);

      // Supplier Information
      doc.fontSize(14).font('Helvetica-Bold').text('Supplier Information');
      doc.fontSize(12).font('Helvetica').text(`Name: ${supplierName}`);
      doc.moveDown(0.5);
      doc.text(`Report Generated: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`);
      doc.moveDown(1);

      // Summary Section
      doc.fontSize(14).font('Helvetica-Bold').text('Summary');
      doc.fontSize(11).font('Helvetica');
      doc.text(`Total Orders: ${summary.totalOrders}`);
      doc.text(`Total Amount: Rs ${summary.totalAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`);
      doc.text(`Total Paid: Rs ${summary.totalPaid.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`);
      doc.text(`Outstanding Balance: Rs ${summary.balance.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`);
      doc.moveDown(1);

      // Orders Table Header
      doc.fontSize(12).font('Helvetica-Bold');
      const tableTop = doc.y;
      const itemHeight = 20;
      const pageWidth = doc.page.width;
      const leftMargin = 50;
      const rightMargin = 50;
      const tableWidth = pageWidth - leftMargin - rightMargin;

      // Table headers
      doc.text('Date', leftMargin, tableTop);
      doc.text('Product', leftMargin + 80, tableTop);
      doc.text('Liters', leftMargin + 150, tableTop);
      doc.text('Rate/L', leftMargin + 210, tableTop);
      doc.text('Total', leftMargin + 270, tableTop);
      doc.text('Paid', leftMargin + 330, tableTop);
      doc.text('Balance', leftMargin + 390, tableTop);
      doc.text('Status', leftMargin + 450, tableTop);

      // Draw line under header
      doc.moveTo(leftMargin, tableTop + 15)
        .lineTo(pageWidth - rightMargin, tableTop + 15)
        .stroke();

      // Orders
      let yPosition = tableTop + 25;
      doc.fontSize(10).font('Helvetica');

      orders.forEach((order, index) => {
        // Check if we need a new page
        if (yPosition > doc.page.height - 100) {
          doc.addPage();
          yPosition = 50;
        }

        const orderDate = new Date(order.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        doc.text(orderDate, leftMargin, yPosition);
        doc.text(order.product || '-', leftMargin + 80, yPosition);
        doc.text(
          order.liters ? `${order.liters.toFixed(2)}L` : '-',
          leftMargin + 150,
          yPosition
        );
        doc.text(
          order.ratePerLitre ? `Rs ${order.ratePerLitre.toFixed(2)}` : '-',
          leftMargin + 210,
          yPosition
        );
        doc.text(
          `Rs ${order.totalAmount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          leftMargin + 270,
          yPosition
        );
        doc.text(
          `Rs ${order.paidAmount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          leftMargin + 330,
          yPosition
        );
        doc.text(
          `Rs ${order.balance.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          leftMargin + 390,
          yPosition
        );
        doc.text(order.paymentStatus.toUpperCase(), leftMargin + 450, yPosition);

        yPosition += itemHeight;

        // Draw line after each row
        if (index < orders.length - 1) {
          doc.moveTo(leftMargin, yPosition - 5)
            .lineTo(pageWidth - rightMargin, yPosition - 5)
            .stroke();
        }
      });

      // Footer
      const footerY = doc.page.height - 50;
      doc.fontSize(8).font('Helvetica').text(
        'This is a computer-generated document. For any queries, please contact RK & Co.',
        leftMargin,
        footerY,
        { align: 'center', width: tableWidth }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

