interface ReceiptData {
  receiptNumber: string;
  timestamp: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: string;
    total: string;
    name?: string;
  }>;
  subtotal: string;
  tax: string;
  total: string;
  paymentMethod: string;
  customerName?: string;
}

interface ThermalReceiptProps {
  receiptData: ReceiptData;
  onPrint: () => void;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
}

export default function ThermalReceipt({
  receiptData,
  onPrint,
  businessName = "Your POS System",
  businessAddress = "123 Business St, City, State 12345",
  businessPhone = "(555) 123-4567"
}: ThermalReceiptProps) {
  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=302,height=500');
    if (!printWindow) return;

    // Generate receipt HTML for thermal printer (302px width = ~80mm)
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt ${receiptData.receiptNumber}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              width: 302px;
              margin: 0 auto;
              padding: 8px;
              background: white;
              color: black;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { 
              border-top: 1px dashed #333; 
              margin: 4px 0; 
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
            .item-row {
              margin: 3px 0;
            }
            .item-name {
              font-weight: bold;
              margin-bottom: 1px;
            }
            .item-details {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
            }
            .footer {
              margin-top: 8px;
              text-align: center;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 14px;">
            ${businessName}
          </div>
          <div class="center" style="font-size: 10px;">
            ${businessAddress}
          </div>
          <div class="center" style="font-size: 10px;">
            ${businessPhone}
          </div>
          
          <div class="divider"></div>
          
          <div class="center bold">
            RECEIPT #${receiptData.receiptNumber.slice(-8)}
          </div>
          <div class="center" style="font-size: 10px;">
            ${new Date(receiptData.timestamp).toLocaleString()}
          </div>
          
          <div class="divider"></div>
          
          ${receiptData.items.map(item => `
            <div class="item-row">
              <div class="item-name">${item.name || `Product ${item.productId.slice(-6)}`}</div>
              <div class="item-details">
                <span>${item.quantity}x @ $${item.unitPrice}</span>
                <span>$${item.total}</span>
              </div>
            </div>
          `).join('')}
          
          <div class="divider"></div>
          
          <div class="row">
            <span>SUBTOTAL:</span>
            <span>$${receiptData.subtotal}</span>
          </div>
          <div class="row">
            <span>TAX (8.5%):</span>
            <span>$${receiptData.tax}</span>
          </div>
          <div class="row bold">
            <span>TOTAL:</span>
            <span>$${receiptData.total}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="row">
            <span>PAYMENT:</span>
            <span>${receiptData.paymentMethod.toUpperCase()}</span>
          </div>
          
          ${receiptData.customerName ? `
            <div class="row">
              <span>CUSTOMER:</span>
              <span>${receiptData.customerName}</span>
            </div>
          ` : ''}
          
          <div class="footer">
            <div>Thank you for your business!</div>
            <div>Please come again</div>
          </div>
          
          <script>
            // Auto-print when loaded
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Call the onPrint callback
    onPrint();
  };

  return (
    <div className="hidden">
      {/* This component handles printing logic but doesn't render UI */}
    </div>
  );
}

// Export print function for use without component
export const printThermalReceipt = (
  receiptData: ReceiptData,
  businessInfo: { name?: string; address?: string; phone?: string } = {}
) => {
  const businessName = businessInfo.name || "Your POS System";
  const businessAddress = businessInfo.address || "123 Business St, City, State 12345";
  const businessPhone = businessInfo.phone || "(555) 123-4567";

  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=302,height=500');
  if (!printWindow) return;

  // Generate receipt HTML for thermal printer (302px width = ~80mm)
  const receiptHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt ${receiptData.receiptNumber}</title>
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            width: 302px;
            margin: 0 auto;
            padding: 8px;
            background: white;
            color: black;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { 
            border-top: 1px dashed #333; 
            margin: 4px 0; 
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
          .item-row {
            margin: 3px 0;
          }
          .item-name {
            font-weight: bold;
            margin-bottom: 1px;
          }
          .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
          }
          .footer {
            margin-top: 8px;
            text-align: center;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 14px;">
          ${businessName}
        </div>
        <div class="center" style="font-size: 10px;">
          ${businessAddress}
        </div>
        <div class="center" style="font-size: 10px;">
          ${businessPhone}
        </div>
        
        <div class="divider"></div>
        
        <div class="center bold">
          RECEIPT #${receiptData.receiptNumber.slice(-8)}
        </div>
        <div class="center" style="font-size: 10px;">
          ${new Date(receiptData.timestamp).toLocaleString()}
        </div>
        
        <div class="divider"></div>
        
        ${receiptData.items.map(item => `
          <div class="item-row">
            <div class="item-name">${item.name || `Product ${item.productId.slice(-6)}`}</div>
            <div class="item-details">
              <span>${item.quantity}x @ $${item.unitPrice}</span>
              <span>$${item.total}</span>
            </div>
          </div>
        `).join('')}
        
        <div class="divider"></div>
        
        <div class="row">
          <span>SUBTOTAL:</span>
          <span>$${receiptData.subtotal}</span>
        </div>
        <div class="row">
          <span>TAX (8.5%):</span>
          <span>$${receiptData.tax}</span>
        </div>
        <div class="row bold">
          <span>TOTAL:</span>
          <span>$${receiptData.total}</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="row">
          <span>PAYMENT:</span>
          <span>${receiptData.paymentMethod.toUpperCase()}</span>
        </div>
        
        ${receiptData.customerName ? `
          <div class="row">
            <span>CUSTOMER:</span>
            <span>${receiptData.customerName}</span>
          </div>
        ` : ''}
        
        <div class="footer">
          <div>Thank you for your business!</div>
          <div>Please come again</div>
        </div>
        
        <script>
          // Auto-print when loaded
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(receiptHTML);
  printWindow.document.close();
  
  console.log('Receipt printed');
};