export function Footer() {
    return (
      <footer className="bg-gray-100 border-t py-4">
        <div className="container text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Your Company. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }