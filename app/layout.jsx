export const metadata = { title: 'Formation Demo Pro', description: 'Canvas with sine/bezier/bulletml paths' };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{margin:0, fontFamily:'system-ui, sans-serif', background:'#0b0f1a', color:'#eaeaea'}}>
        {children}
      </body>
    </html>
  );
}
